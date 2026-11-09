-- Day 63 시안의 학습용 상품. 먼저 product-image에 원본 4개를 올린다.
with registered as (
  insert into public.product (
    id, name, description, event_at, address, capacity, price, publication_status, cancel_policy, sponsor_disclosure
  )
  values (
    'f06b75f7-6fd0-4380-8c7a-d06fe4b18a20', '초밥 도시락 쿠킹 클래스',
    '주말 오후, 이웃과 함께 초밥 다섯 가지와 소스 두 가지를 만들어 도시락에 담아 갑니다. 재료와 도구는 모두 준비되어 있어요. (학습용 예시)',
    '2026-11-21T14:00:00+09:00', '구로 쿠킹 스튜디오 (샘플)', 12, 35000, 'PUBLIC',
    '테스트 상품입니다. 실제 환불 규정은 아직 정해지지 않았어요.',
    '이 프로그램은 식당에서 비용이나 대가를 받지 않아요 (샘플 표기).'
  )
  returning id
)
insert into public.product_image (product_id, variant, image_path)
select id, variant, 'day64/sushi-bento/' || filename from registered
cross join (values
  ('banner_mobile', 'banner-720x360.png'),
  ('banner_desktop', 'banner-2480x806.png'),
  ('hero_mobile', 'hero-720x360.png'),
  ('hero_desktop', 'hero-2480x806.png')
) as images(variant, filename);
