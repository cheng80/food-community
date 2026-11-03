-- 소프트 삭제: 삭제된 글은 BFF뿐 아니라 Data API 직접 조회에서도 보이지 않는다.
alter table public.place add column deleted_at timestamptz;
drop index public.place_created_at_idx;
create index place_live_created_at_idx on public.place(created_at desc) where deleted_at is null;

drop policy place_read on public.place;
create policy place_read on public.place for select to anon, authenticated using (deleted_at is null);
drop policy place_insert on public.place;
create policy place_insert on public.place for insert to authenticated with check (user_id = (select auth.uid()) and deleted_at is null);
drop policy place_update on public.place;
create policy place_update on public.place for update to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()) and deleted_at is null);

-- 영구 삭제와 deleted_at, user_id 직접 변경을 막는다. place_image는 부모 글 조회 정책을 따라 함께 숨겨진다.
drop policy place_delete on public.place;
revoke delete on public.place from authenticated;
revoke update on public.place from authenticated;
grant update (title, content, address, updated_at) on public.place to authenticated;

-- 조회 정책이 삭제 후 행을 숨기므로 invoker로는 이 UPDATE가 RLS에 막힌다.
-- 그래서 definer를 쓰고, 본문에서 auth.uid() 소유권을 직접 확인하며 anon 실행을 막는다.
create function public.soft_delete_place(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.place set deleted_at = now(), updated_at = now()
  where id = p_id and user_id = (select auth.uid()) and deleted_at is null;
  return found;
end;
$$;
revoke execute on function public.soft_delete_place(uuid) from public, anon;
grant execute on function public.soft_delete_place(uuid) to authenticated;
