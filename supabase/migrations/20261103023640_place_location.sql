-- 장소명과 좌표. title은 글 제목이고 name은 장소 이름으로 서로 다른 값이다.
-- 기존 행은 좌표를 추정하지 않고 NULL로 둔다. 화면은 지도 없이 주소만 표시하고, 수정할 때 장소를 다시 골라야 저장된다.
alter table public.place
  add column name text check (name is null or char_length(btrim(name, E' \t\r\n')) between 1 and 60),
  add column lat double precision check (lat is null or (lat between -90 and 90 and lat <> 0)),
  add column lng double precision check (lng is null or (lng between -180 and 180 and lng <> 0));

-- NOT VALID: 기존 행은 검사하지 않고 새 행과 수정되는 행에만 적용한다. 삭제 처리만 하는 기존 행은 허용한다.
alter table public.place add constraint place_location_required
  check (deleted_at is not null or (name is not null and lat is not null and lng is not null)) not valid;
grant update (name, lat, lng) on public.place to authenticated;

drop function public.save_place(uuid, text, text, text, text[]);
create function public.save_place(
  p_id uuid, p_title text, p_content text, p_name text, p_address text, p_lat double precision, p_lng double precision, p_image_paths text[]
) returns table (id uuid, removed_paths text[])
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
    insert into public.place (user_id, title, content, name, address, lat, lng)
    values ((select auth.uid()), p_title, p_content, p_name, p_address, p_lat, p_lng)
    returning place.id into v_id;
  else
    -- 행 잠금으로 같은 글의 동시 저장을 직렬화한다. 타인 글과 없는 글은 RLS로 0행이다.
    update public.place set title = p_title, content = p_content, name = p_name, address = p_address, lat = p_lat, lng = p_lng, updated_at = now()
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
revoke execute on function public.save_place(uuid, text, text, text, text, double precision, double precision, text[]) from public, anon;
grant execute on function public.save_place(uuid, text, text, text, text, double precision, double precision, text[]) to authenticated;
