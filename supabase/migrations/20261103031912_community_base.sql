-- Day55 기본 스키마: auth.users 1:1 profile 1:N place 1:N place_image
-- Storage 버킷에는 파일을, DB에는 `userUUID/uuidv4.ext` 경로만 저장한다.
create table public.profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text check (nickname is null or char_length(btrim(nickname, E' \t\r\n')) between 2 and 12),
  image_path text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  created_at timestamptz not null default now()
);
create table public.place (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile(user_id) on delete cascade,
  title text not null check (char_length(btrim(title, E' \t\r\n')) between 1 and 40),
  content text not null check (char_length(btrim(content, E' \t\r\n')) between 10 and 10000),
  address text not null check (char_length(btrim(address, E' \t\r\n')) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.place_image (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place(id) on delete cascade,
  image_path text not null unique check (image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  position smallint not null check (position between 0 and 4),
  unique (place_id, position)
);
create index place_user_id_idx on public.place(user_id);
create index place_created_at_idx on public.place(created_at desc);

-- 회원가입 시 profile 1:1 행을 만든다. 구글 이름이 닉네임 규칙에 맞으면 기본값으로 쓴다(PRD 7.2).
-- 표시용 값만 복사하며 권한 판단에는 user_metadata를 쓰지 않는다. 이미지는 Storage 경로만 저장하므로 비워 둔다.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profile (user_id, nickname)
  select new.id, case when char_length(name) between 2 and 12 then name end
  from (select btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''), E' \t\r\n') as name) as google
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 공개 조회, 본인 쓰기. 새 프로젝트는 Data API 자동 노출이 없으므로 grant를 명시한다.
alter table public.profile enable row level security;
alter table public.place enable row level security;
alter table public.place_image enable row level security;
grant select on public.profile, public.place, public.place_image to anon, authenticated;
grant insert, update on public.profile to authenticated;
grant insert, update, delete on public.place to authenticated;
grant insert, delete on public.place_image to authenticated;

create policy profile_read on public.profile for select to anon, authenticated using (true);
create policy profile_insert on public.profile for insert to authenticated with check (
  user_id = (select auth.uid()) and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
);
create policy profile_update on public.profile for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
);
create policy place_read on public.place for select to anon, authenticated using (true);
create policy place_insert on public.place for insert to authenticated with check (user_id = (select auth.uid()));
create policy place_update on public.place for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy place_delete on public.place for delete to authenticated using (user_id = (select auth.uid()));
create policy image_read on public.place_image for select to anon, authenticated using (exists (select 1 from public.place p where p.id = place_id));
create policy image_insert on public.place_image for insert to authenticated with check (
  exists (select 1 from public.place p where p.id = place_id and p.user_id = (select auth.uid()))
  and split_part(image_path, '/', 1) = (select auth.uid())::text
);
create policy image_delete on public.place_image for delete to authenticated using (
  exists (select 1 from public.place p where p.id = place_id and p.user_id = (select auth.uid()))
);

-- 공개 버킷은 URL로 읽는다. 쓰기와 소유자 조회는 첫 경로가 본인 UUID일 때만 허용한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('profile-image', 'profile-image', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('place-image', 'place-image', true, 10485760, array['image/jpeg','image/png','image/webp']);
create policy media_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('profile-image','place-image') and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy media_owner_read on storage.objects for select to authenticated using (
  bucket_id in ('profile-image','place-image') and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy media_delete on storage.objects for delete to authenticated using (
  bucket_id in ('profile-image','place-image') and (storage.foldername(name))[1] = (select auth.uid())::text
);
