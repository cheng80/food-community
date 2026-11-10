-- 로컬 Supabase 스텁과 모든 migration을 적용한 임시 DB에서만 실행한다.
begin;
set local plpgsql.check_asserts = on;

insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'), ('10000000-0000-0000-0000-000000000002');

set local role service_role;
insert into public.product (id, name, description, event_at, address, capacity, price, publication_status, cancel_policy, sponsor_disclosure)
values
  ('20000000-0000-0000-0000-000000000001', '초밥 도시락 쿠킹 클래스', '테스트 상품', '2026-11-21 14:00+09', '테스트 장소', 12, 35000, 'PUBLIC', '테스트 규정', '테스트 표기'),
  ('20000000-0000-0000-0000-000000000002', '미공개 수업', '', '2026-11-21 14:00+09', '테스트 장소', 12, 35000, default, '', '');
insert into public.product_image (product_id, variant, image_path) values
  ('20000000-0000-0000-0000-000000000001', 'banner_mobile', 'class/banner.png'),
  ('20000000-0000-0000-0000-000000000002', 'banner_mobile', 'hidden/banner.png');

insert into public.payment_snapshot (id, payment_snapshot, product_snapshot)
select ('30000000-0000-0000-0000-00000000000' || n)::uuid, '{"payMethod":"CARD"}', '{"price":35000}'
from generate_series(1, 5) n;
insert into public.payment (transaction_key, provider_event_key, status, amount, product_id, user_id, payment_snapshot_id) values
  ('demo-order-001', 'approved-1', 'PAID', 35000, '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('demo-order-001', 'cancelled-1', 'CANCELLED', -35000, '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002'),
  ('demo-order-002', 'approved-2', 'PAID', 35000, '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('demo-other-user', 'approved-3', 'PAID', 35000, '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004');

do $$
begin
  begin
    insert into public.payment (transaction_key, provider_event_key, status, amount, product_id, user_id, payment_snapshot_id)
    select transaction_key, provider_event_key, status, amount, product_id, user_id, '30000000-0000-0000-0000-000000000005'
    from public.payment where provider_event_key = 'cancelled-1';
    raise exception '중복 이벤트가 저장됨';
  exception when unique_violation then null;
  end;
  begin
    insert into public.payment (transaction_key, provider_event_key, status, amount, product_id, user_id, payment_snapshot_id)
    select transaction_key, 'invalid-cancel', 'CANCELLED', 35000, product_id, user_id, '30000000-0000-0000-0000-000000000005'
    from public.payment where provider_event_key = 'approved-1';
    raise exception '양수 취소 금액이 저장됨';
  exception when check_violation then null;
  end;
end;
$$;

update public.product set price = 40000 where id = '20000000-0000-0000-0000-000000000001';

set local role anon;
do $$
begin
  assert (select count(*) from public.product) = 1, '비공개 상품 노출';
  assert (select count(*) from public.product_image) = 1, '비공개 이미지 노출';
  assert not has_table_privilege(current_user, 'public.payment', 'select'), '익명 결제 조회 허용';
  assert not has_table_privilege(current_user, 'public.payment_snapshot', 'select'), '익명 스냅샷 조회 허용';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001"}', true);
do $$
begin
  assert (select count(*) from public.payment) = 3, '본인 이력 누락 또는 타인 이력 노출';
  assert (select count(*) from public.payment_snapshot) = 3, '타인 또는 미연결 스냅샷 노출';
  assert (select sum(amount) from public.payment where transaction_key = 'demo-order-001') = 0, '취소한 그룹 잔액';
  assert (select sum(amount) from public.payment where transaction_key = 'demo-order-002') = 35000, '재결제 그룹 잔액';
  assert (select price from public.product) = 40000, '현재 상품 가격 변경 실패';
  assert (select min((product_snapshot ->> 'price')::integer) from public.payment_snapshot) = 35000, '과거 가격 보존 실패';
  assert not exists (
    select 1 from unnest(array['public.payment', 'public.payment_snapshot', 'public.product', 'public.product_image']) as tbl
    cross join unnest(array['insert', 'update', 'delete', 'truncate']) as privilege
    where has_table_privilege(current_user, tbl, privilege)
  ), '일반 회원 쓰기 허용';
end;
$$;

reset role;
do $$
begin
  begin
    update public.payment set amount = 1 where provider_event_key = 'approved-1';
    raise exception '결제 이벤트 수정 허용';
  exception when sqlstate '55000' then null;
  end;
  begin
    delete from public.payment_snapshot where id = '30000000-0000-0000-0000-000000000001';
    raise exception '스냅샷 삭제 허용';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

set local role service_role;
insert into public.payment_checkout (id, product_id, user_id, amount, product_snapshot) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001', 35000, '{"name":"Day64 테스트","price":35000}');
do $$
declare
  event_id uuid;
begin
  begin
    perform public.record_portone_payment('40000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', now());
    raise exception '타인 결제 처리 허용';
  exception when no_data_found then null;
  end;
  event_id := public.record_portone_payment('40000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000001', now());
  assert event_id = public.record_portone_payment('40000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000001', now()),
    '재요청에서 기존 결제 반환 실패';
  assert (select count(*) from public.payment where transaction_key = '40000000-0000-4000-8000-000000000001') = 1, '중복 승인';
  assert (select count(*) from public.payment_snapshot) = 6, '스냅샷 중복 또는 누락';
  assert (select s.product_snapshot ->> 'price' from public.payment p join public.payment_snapshot s on s.id = p.payment_snapshot_id where p.id = event_id) = '35000',
    '주문 당시 가격 저장 실패';
  assert not has_function_privilege('authenticated', 'public.record_portone_payment(uuid,uuid,timestamptz)', 'execute'), '일반 회원이 승인 기록 가능';
  assert not has_table_privilege('authenticated', 'public.payment_checkout', 'select'), '주문 준비 정보 노출';
end;
$$;

insert into public.payment_checkout (id, product_id, user_id, amount, product_snapshot) values
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002', 35000, '{"name":"취소가 먼저 온 주문","price":35000}');

do $$
declare
  first_order uuid := '40000000-0000-4000-8000-000000000001';
  second_order uuid := '40000000-0000-4000-8000-000000000002';
  first_cancel jsonb := '[{"id":"partial","amount":10000,"cancelled_at":"2026-11-09T03:00:00Z"}]';
  rest_cancel jsonb := '[{"id":"rest","amount":25000}]';
begin
  perform public.record_portone_cancellations(first_order, null, first_cancel);
  begin
    perform public.record_portone_cancellations(first_order, null, '[{"id":"rollback","amount":25000},{"id":"over","amount":1}]');
    raise exception '승인액 초과 취소 허용';
  exception when check_violation then null;
  end;
  assert (select sum(amount) from public.payment where transaction_key = first_order::text) = 25000, '실패한 배치 일부 저장';
  perform public.record_portone_cancellations(first_order, null, rest_cancel || first_cancel);
  perform public.record_portone_cancellations(first_order, null, first_cancel);
  assert (select sum(amount) from public.payment where transaction_key = first_order::text) = 0, '전액 취소 후 잔액';
  assert (select count(*) from public.payment where transaction_key = first_order::text) = 3, '중복 취소 또는 원승인 변경';
  assert (select s.product_snapshot ->> 'price' from public.payment p join public.payment_snapshot s
    on s.id = p.payment_snapshot_id where p.provider_event_key = 'portone:cancel:' || first_order::text || ':partial') = '35000',
    '취소 스냅샷은 원승인 당시 가격을 보존해야 함';
  assert (select count(*) from public.payment_snapshot) = 8, '중복 또는 고아 취소 스냅샷';

  begin
    perform public.record_portone_cancellations(second_order, now(), '[{"id":"over","amount":35001}]');
    raise exception '승인 전 초과 취소 허용';
  exception when check_violation then null;
  end;
  assert not exists (select 1 from public.payment where transaction_key = second_order::text), '취소 저장 실패 후 원승인만 남음';
  perform public.record_portone_cancellations(second_order, '2026-11-09T02:00:00Z', '[{"id":"all","amount":35000}]');
  perform public.record_portone_payment(second_order, '10000000-0000-0000-0000-000000000002', now());
  assert (select count(*) from public.payment where transaction_key = second_order::text) = 2, '취소 선도착 후 중복 승인';
  assert (select sum(amount) from public.payment where transaction_key = second_order::text) = 0, '취소 선도착 후 잔액';
  assert not has_function_privilege('authenticated', 'public.record_portone_cancellations(uuid,timestamptz,jsonb)', 'execute'),
    '일반 회원이 취소 기록 가능';
  assert not has_function_privilege('anon', 'public.record_portone_cancellations(uuid,timestamptz,jsonb)', 'execute'),
    '비회원이 취소 기록 가능';
end;
$$;

set local role authenticated;
do $$
begin
  assert (select count(*) from public.payment where status = 'CANCELLED' and transaction_key like '40000000-%') = 2,
    '본인 취소 누락 또는 타인 취소 노출';
end;
$$;

rollback;
