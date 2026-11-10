# Day 64: 상품 조회와 포트원 테스트 결제

[이어받기: 실행, 배포, 테스트 결제와 취소](HANDOFF.md)

[첫 학습 자료](https://lms.codebootcamp.co.kr/my/materials/29852e29-a6df-436d-be0a-a7c6bc4e3e35)의 상품·결제·스냅샷 관계를 Day 63 데이터 설계에 맞춰 [마이그레이션](../../supabase/migrations/20261109053855_product_payment_schema.sql)으로 구현했다.

| 테이블 | 역할 |
| --- | --- |
| `product` | 일정·장소·정원·원화 가격·취소 규정·협찬 표기. 공개 상태 기본값은 `DRAFT`다. |
| `product_image` | Day 63 이미지 4종의 상대 경로. 상품당 같은 종류의 이미지 경로는 한 개다. |
| `payment` | 승인 양수·확정 취소 음수를 별도 행에 저장한다. 승인과 취소는 같은 `transaction_key`를 쓰고, 재결제는 새 키를 쓴다. 이벤트 키는 중복될 수 없다. |
| `payment_snapshot` | 이벤트마다 결제 표시 정보와 당시 상품 정보를 JSON으로 보관한다. |

교재의 `payment.user_id → auth.users.id` 대신 기존 `profile.user_id → auth.users.id` 관계를 재사용한다. 결제 이력이 있는 상품·회원은 DB에서 바로 삭제할 수 없으므로, 회원 탈퇴를 만들 때 결제 보존과 계정 연결 해제 정책을 먼저 정한다. 원화 금액은 정수, PortOne `paymentId`로 쓸 거래 키는 문자열이다.

익명 사용자는 공개 상품과 그 이미지 경로만 읽고, 로그인한 사용자는 본인 결제와 연결된 스냅샷만 읽는다. 결제 기록은 서버에서만 추가할 수 있고, 추가된 결제와 스냅샷은 변경·삭제할 수 없다.

[SQL 검증](../../tests/harness/product-payment.sql)은 임시 DB에 [Supabase 스텁](../../tests/harness/supabase-stub.sql)과 기존 마이그레이션을 순서대로 적용한 뒤 실행한다. 승인·취소·재결제 예시는 테스트 트랜잭션에서만 사용하고 롤백한다.

2026-11-09에 기존 `food-community` 프로젝트에 마이그레이션을 적용했다. 원격 이력과 새 테이블 4개의 RLS 활성화를 확인했다. 익명 Data API에서 상품·이미지 경로는 빈 목록으로 응답했고 결제·스냅샷 조회는 거절됐다.

포트원 승인 응답에서 회원·상품·금액을 대조한 뒤 스냅샷과 이벤트를 같은 트랜잭션에 기록한다. 스냅샷에는 화면에 필요한 필드만 담고 카드 번호·연락처·PG 응답 원문을 저장하지 않는다.

## 이미지와 상품 조회

- [이미지 스토리지 자료](https://lms.codebootcamp.co.kr/my/materials/42428dcd-4db9-4a9b-bcc0-589361bd4ee4)대로 `product-image` 공개 버킷을 추가했다. 관리자만 쓰고, PNG/JPEG/WebP 각 5MB까지 받는다. 공개 URL을 아는 사람은 파일을 읽을 수 있으므로 여기에 비공개 이미지를 올리지 않는다.
- [상품 등록 자료](https://lms.codebootcamp.co.kr/my/materials/cbe39ea3-4270-4e8b-9102-52f50e5a7161)에 따라 [배너·상세 원본 이미지](https://github.com/cheng80/food-community/tree/5c2079a919fb5012e7bb9ef5cde0e40881ef912d/public/images/program) 4개를 올리고 공개 URL의 파일이 원본과 같은지 확인했다. [등록 SQL](register-product.sql)로 학습용 초밥 도시락 쿠킹 클래스(35,000원)와 상대 경로를 한 번에 등록했다.
- [상품 조회 자료](https://lms.codebootcamp.co.kr/my/materials/210d9ef4-a46b-4aef-a48e-a75c40fececf)를 따라 BFF 목록·상세를 연결했다. RLS와 BFF 양쪽에서 공개 상품만 읽는다. 스토리지 기본 URL은 환경변수, 파일 경로는 DB에서 가져온다. Ego에서 이미지, 상품명, 참가비와 테스트 결제 시트를 확인했다.

## 포트원 V2 카드 테스트

[마지막 학습 자료](https://lms.codebootcamp.co.kr/my/materials/ad8b8913-28c1-4f87-952f-f70a1c168cf5) 기준. [공식 PortOne MCP](https://developers.portone.io/opi/ko/integration/using-ai-tools?v=v2)를 [프로젝트 설정](../../.mcp.json)에 등록하고 KG이니시스 V2 문서 조회를 확인했다. 단계별 복제 대신 동일 저장소에서 기존 앱과 로그인·DB를 재사용한다.

1. `.env.example`의 Supabase 값과 `PORTONE_STORE_ID`, `PORTONE_TEST_CHANNEL_KEY`, `PORTONE_API_SECRET`, `SUPABASE_PAYMENT_SERVER_KEY`를 로컬 파일에 설정한다. 채널 키는 콘솔의 **테스트** 채널에서, API Secret은 **식별코드·API Keys → V2 API**에서 얻는다. 상점 ID, 채널 키, Secret은 서로 다른 값이다.
2. `APP_URL=http://localhost:3000 npm run dev -- --hostname localhost --port 3000`으로 실행한다. 이 포트는 기존 Google 로그인 콜백 허용 주소와 일치한다.
3. [로컬 앱](http://localhost:3000)에서 상품 배너 → 수업 참여하기 → Google 로그인 → 카드 테스트 결제로 진행한다. 서버가 포트원에서 승인을 확인한 뒤에만 완료 화면이 표시된다.

SQL 테스트는 임시 DB에서 승인·스냅샷 원자 저장, 본인 확인 및 재요청의 중복 차단을 검증한다. Vitest는 승인 응답이 금액·채널·회원과 불일치하면 거부하는지 확인한다. [결제 규칙](../../.claude/rules/payment.md)과 [BFF 계약](../api-contract.md)을 참고한다.

2026-11-09 로컬 Ego에서 사용자가 **네이버페이 카드 35,000원 테스트 승인**을 완료했다. 포트원은 네이버페이 카드를 간편결제 안의 카드로 반환하므로 이 형식도 인정하도록 보완했다. 같은 결제를 다시 확인해 완료 화면과 Supabase 승인·스냅샷을 확인했다.

공통 로딩 중에도 페이지를 렌더링하도록 수정한 뒤, Ego에서 홈·상품 상세·기존 결제 완료·마이 페이지의 Next.js 즉시 탐색 오류가 사라진 것을 확인했다. `rhwp`가 실행되지 않는 Ego 시크릿 창에서도 홈 → 상품 → 로그인 이동을 확인했다.

## 공개 배포와 승인·취소 검증

2026-11-09 구현 커밋 `e42c144`를 [공개 Vercel 앱](https://food-community-nine.vercel.app)에 배포했다. 공개 상품 목록·상세와 이미지 4개는 HTTP 200, 익명 결제 요청은 401, 다른 Origin의 쓰기 요청은 403이었다. `ego-browser` 전용 Space에서 기존 로그인으로 상품을 열고, 사용자가 일반 카드 테스트 승인을 마친 뒤 완료 화면, 포트원 `TEST`·`PAID`, Supabase 승인 1건과 상품·금액이 일치하는 스냅샷을 확인했다.

| 환경·수단 | 승인 시각(KST) | 취소 결과 |
| --- | --- | --- |
| 로컬 · 네이버페이 카드 | 16:38 | 35,000원 전액 취소. 네이버페이 웹에 `결제취소` 표시 |
| 공개 · KG이니시스 일반 카드 | 17:16 | 35,000원 전액 취소 |

두 건 모두 17:35 KST에 포트원 V2로 전액 취소했고, 재조회에서 `CANCELLED`와 각 35,000원을 확인했다. 현대카드 공식 웹의 최근 이용 내역에도 17:35에 각 35,000원 `거래취소` 두 건이 표시됐다. 모바일 앱 화면과 청구·정산 내역은 확인하지 않았다.

두 취소는 앱에 웹훅을 연결하기 전에 포트원에서 처리했다.

## 취소 웹훅 연결

1. [취소 동기화 마이그레이션](../../supabase/migrations/20261110011709_portone_cancellation.sql)을 대상 Supabase에 적용한다.
2. [포트원 V2 웹훅 설정](https://developers.portone.io/opi/ko/integration/webhook/readme-v2)에서 **테스트** 웹훅 서명 키를 발급한다. Vercel Production의 `PORTONE_WEBHOOK_SECRET`에 등록한 뒤 이 코드를 배포한다.
3. 같은 테스트 설정에서 V2 본문 버전 `2024-04-25`, JSON, 엔드포인트 `https://<앱 주소>/api/payments/webhook`을 저장한다. 호출 테스트로 연결을 확인한다.
4. 취소 알림을 재발송할 수 있는 테스트 거래로 검증한다. 포트원 확정 금액과 **마이 페이지 → 테스트 결제 내역**의 승인·음수 취소를 대조하고, 같은 알림을 다시 보내도 취소가 한 번만 표시되는지 확인한다.

웹훅은 확정된 전액·부분 취소만 저장한다. 원승인은 보존되며, 브라우저가 승인을 확인하기 전에 취소가 와도 승인 정보가 포트원에서 검증되면 두 이력을 함께 저장한다. 연결 전에 취소된 두 건은 자동 소급하지 않는다. 포트원에 재발송할 웹훅 이력이 없으면 별도의 이관이 필요하다. 앱에서 취소를 요청하는 API는 없다.

2026-11-10 공개 배포에 마이그레이션 `20261110011709`과 테스트 웹훅을 연결했다. 포트원 콘솔 호출 테스트는 HTTP 200이었다. 사용자가 새 35,000원 카드 테스트 승인을 한 뒤 포트원에서 전액 취소하고, 같은 `CANCELLED` 웹훅을 재발송했다. 첫 발송과 수동 재발송 모두 성공했고, Ego CLI에서 마이 페이지를 다시 열어 같은 취소 행 1건(-35,000원)만 표시되는 것을 확인했다. Supabase에서도 원승인과 취소 각각 1건과 각각의 스냅샷을 확인했다. 연결 전 취소 건에는 웹훅 발송 이력이 없어 재발송 API가 `WEBHOOK_NOT_FOUND`로 응답했다.

같은 날 테스트 결제 시트와 포트원 카드 결제창의 딤이 오른쪽 스크롤바 15px를 덮지 않는 문제를 수정했다. 공개 배포를 다시 열어 두 딤이 Ego 데스크톱 뷰포트 전체(1195×896px)를 덮고 팝업을 닫으면 스크롤이 복구되는 것을 확인했다. 화면 확인 중 추가 카드 승인은 하지 않았다.
