-- 글과 이미지 경로를 한 트랜잭션으로 저장한다. 어느 단계든 실패하면 전체가 롤백된다.
-- security invoker이므로 place, place_image의 RLS가 그대로 적용된다.
create function public.save_place(p_id uuid, p_title text, p_content text, p_address text, p_image_paths text[])
returns table (id uuid, removed_paths text[])
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_removed text[];
begin
  if (select auth.uid()) is null then
    raise exception 'login required' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_image_paths), 0) not between 1 and 5 then
    raise exception 'place needs 1 to 5 images' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.place (user_id, title, content, address)
    values ((select auth.uid()), p_title, p_content, p_address)
    returning place.id into v_id;
  else
    -- 행 잠금으로 같은 글의 동시 저장을 직렬화한다. 타인 글과 없는 글은 RLS로 0행이다.
    update public.place set title = p_title, content = p_content, address = p_address, updated_at = now()
    where place.id = p_id
    returning place.id into v_id;
    if v_id is null then
      raise exception 'place not found' using errcode = 'P0002';
    end if;
  end if;

  with deleted as (
    delete from public.place_image where place_id = v_id returning image_path
  )
  select coalesce(array_agg(image_path), '{}') into v_removed from deleted;

  insert into public.place_image (place_id, image_path, position)
  select v_id, path, (ord - 1)::smallint
  from unnest(p_image_paths) with ordinality as images(path, ord);

  return query select v_id, array(select unnest(v_removed) except select unnest(p_image_paths));
end;
$$;
revoke execute on function public.save_place(uuid, text, text, text, text[]) from public, anon;
grant execute on function public.save_place(uuid, text, text, text, text[]) to authenticated;
