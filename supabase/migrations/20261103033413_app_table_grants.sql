-- 실제 프로젝트의 public 기본 권한은 새 테이블마다 anon·authenticated에 모든 권한을 준다. 앱이 쓰는 권한만 남긴다.
-- REVOKE ALL은 컬럼 권한까지 회수하므로 place의 컬럼 UPDATE도 같은 트랜잭션에서 다시 부여한다.
revoke all on public.profile, public.place, public.place_image from anon, authenticated;
grant select on public.profile, public.place, public.place_image to anon, authenticated;
grant insert, update on public.profile to authenticated;
grant insert on public.place to authenticated;
grant update (title, content, name, address, lat, lng, updated_at) on public.place to authenticated;
grant insert, delete on public.place_image to authenticated;

-- rls_auto_enable은 프로젝트에 미리 있는 event trigger 전용 함수이며 직접 호출할 일이 없다. 로컬 스택에는 없을 수 있다.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
