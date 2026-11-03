-- Vercel 함수는 요청 본문이 4.5MB로 제한되고, Supabase 재개 업로드(TUS)는 청크를 6MB로 고정한다.
-- 그래서 BFF가 4MB 이하 조각을 이 비공개 버킷에 임시 저장했다가 완료 시 합쳐 공개 버킷으로 옮긴다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('upload-chunk', 'upload-chunk', false, 4194304, array['application/octet-stream']);
create policy chunk_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'upload-chunk' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy chunk_read on storage.objects for select to authenticated using (
  bucket_id = 'upload-chunk' and (storage.foldername(name))[1] = (select auth.uid())::text
);
-- 같은 조각 재전송은 upsert로 덮어쓴다. upsert에는 INSERT, SELECT, UPDATE가 모두 필요하다.
create policy chunk_update on storage.objects for update to authenticated using (
  bucket_id = 'upload-chunk' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'upload-chunk' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy chunk_delete on storage.objects for delete to authenticated using (
  bucket_id = 'upload-chunk' and (storage.foldername(name))[1] = (select auth.uid())::text
);
