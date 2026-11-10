# BFF API 계약

브라우저의 앱 데이터 요청은 `/api/*`와 `/auth/callback`을 거친다. 이미지 다운로드와 포트원 SDK 결제창은 각 서비스가 제공한다. 브라우저 쓰기 요청은 같은 출처 `Origin`이 없으면 403이다. 오류 본문은 `{ "error": "한국어 메시지" }`이고 응답은 `Cache-Control: private, no-store`다.

공통 상태: `400` 입력 오류, `401` 비로그인, `403` 출처 또는 소유권 오류, `404` 없는 자원, `409` 상태 충돌, `413` 크기 초과, `415` JSON 아님, `502` Supabase 오류, `503` 환경변수 없음.

## 인증

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ next }` (내부 경로만, 아니면 `/`) | `{ url }` 구글 이동 주소. PKCE verifier와 `auth-next`는 HttpOnly 쿠키 |
| GET | `/auth/callback?code=` | | 302 `next` 또는 `/login?error=oauth&next=` |
| POST | `/api/auth/logout` | | `{ ok }` |
| GET | `/api/bootstrap` | | `{ loggedIn, me, users, restaurants }` 공개 조회. 세션은 Auth 서버로 검증 |

## 프로필

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| PATCH | `/api/profile` | `{ nickname, imagePath? }` | `{ ok }` |

`nickname`은 공백 제외 2~12자다. `imagePath`는 업로드 완료 응답의 `path`이며 본인 폴더에 실제로 있어야 한다. 저장에 성공한 뒤 이전 이미지 파일을 지운다.

## 맛집

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| GET | `/api/bootstrap` | | `restaurants`에 최신순 목록 (최대 1000개) |
| GET | `/api/restaurants/{id}` | | `Restaurant`. 없으면 404 |
| POST | `/api/restaurants` | `{ title, content, placeName, address, lat, lng, imagePaths }` | 201 `{ id }` |
| PATCH | `/api/restaurants/{id}` | 같음 | `{ id }`. 타인 글 403 |
| DELETE | `/api/restaurants/{id}` | | `{ ok }`. 소프트 삭제. 타인 글 403 |

- `title`(글 제목) 1~40자, `placeName`(장소 이름) 1~60자, `content` 10~10000자, `address` 1~300자, `lat`·`lng`는 0이 아닌 유효 범위 숫자, `imagePaths`는 본인 폴더의 실제 파일 1~5개다. 작성자는 세션 사용자이며 본문의 값은 무시한다.
- 글과 이미지 경로는 `save_place` RPC 한 트랜잭션으로 저장한다. 실패하면 전체가 롤백되고 기존 파일은 지우지 않는다. 커밋 후 교체된 파일만 지운다.
- 다른 글이 쓰는 경로는 409다.
- 삭제하면 `deleted_at`을 기록한다. 이후 목록, 상세, 마이 페이지, 수정, 재삭제는 없는 글로 처리한다(404). Data API 직접 조회도 RLS로 막힌다. 이미지 행과 파일은 보존하므로, 공개 URL을 아는 사람은 파일 자체를 계속 받을 수 있다.

`Restaurant` 응답의 `placeName`, `lat`, `lng`는 좌표 도입 전 글이면 null이다. 추정값을 넣지 않으며 그 글을 수정하려면 장소를 다시 골라야 한다.

## 상품과 테스트 결제

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| GET | `/api/products` | | `{ products }` 공개 상품 최신순 |
| GET | `/api/products/{id}` | | `{ product }` 공개 상품과 이미지 URL. 없으면 404 |
| GET | `/api/payments` | 로그인 | `{ payments: [{ id, name, status, amount, occurredAt }] }` 본인 승인·취소 이벤트 최근 50건. 취소 금액은 음수, 시각 미제공 시 null |
| POST | `/api/payments` | `{ productId }` | 201 PortOne SDK 요청. 가격은 서버가 결정 |
| POST | `/api/payments/confirm` | `{ productId, paymentId }` | `{ name, amount, hasCancellation }` 승인 정보와 취소 이력 유무 |
| POST | `/api/payments/webhook` | 포트원 V2 `2024-04-25` JSON 원문과 Standard Webhooks 서명 헤더 | `{ ok: true }` 저장 완료, 재전송 또는 처리 대상 외 이벤트 |

브라우저 결제 쓰기 요청에는 인증과 같은 출처가 필요하다. 포트원 미승인·정보 불일치는 409, 포트원 접속 오류는 502, 키 누락이나 인증 거절은 503이다. 웹훅은 브라우저 인증 대신 원문 서명을 검증한다(잘못된 서명 401). `Transaction.Cancelled`·`Transaction.PartialCancelled`는 포트원 단건 조회에서 확인한 `SUCCEEDED` 취소만 반영한다. 확정 내역이 아직 조회되지 않거나 DB 저장에 실패하면 502로 응답해 재전송을 받을 수 있게 한다. 자세한 원칙은 [결제 규칙](../.claude/rules/payment.md)에 있다.

## 네이버 지도

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| POST | `/api/naver/search` | `{ query }` 1~100자 | `{ results: [{ name, address, lat, lng }] }` |
| POST | `/api/naver/reverse` | `{ lat, lng }` | `{ address }`. 바다, 결과 없음, 불완전한 주소는 null |

로그인과 같은 출처 Origin이 필요하다. 비밀 헤더는 서버에서만 붙인다. 네이버 응답은 5초 timeout이며 504, 429는 그대로, 401·403·404·5xx·깨진 응답은 502, 키 없음은 503이다. 브라우저에는 지도 SDK 공개 ID만 전달한다.

## 이미지 업로드

Vercel 함수는 요청 본문을 4.5MB로 제한하고, Supabase 재개 업로드는 청크를 6MB로 고정하므로 쓸 수 없다. 브라우저는 파일을 4MB 조각으로 나눠 BFF에 보내고, 서버는 비공개 `upload-chunk` 버킷에 임시 저장한 뒤 합친다.

| 메서드 | 경로 | 요청 | 응답 |
| --- | --- | --- | --- |
| PUT | `/api/uploads/{uploadId}/{index}` | 조각 바이트 (`index` 0~2, 최대 4MB) | `{ ok }`. 재전송은 덮어씀 |
| POST | `/api/uploads/{uploadId}` | `{ bucket, type, chunks }` | 201 `{ path, url }`. 재시도해도 같은 결과 |
| DELETE | `/api/uploads/{uploadId}` | | `{ ok }` 조각 정리 |
| DELETE | `/api/uploads` | `{ bucket, path }` | `{ ok }` 저장 전 임시 이미지 삭제. 사용 중이면 409 |

- `uploadId`는 브라우저가 만든 UUID이고 최종 경로는 `userUUID/uploadId.ext`다.
- 완료 시 합친 바이트의 시그니처가 `type`과 다르거나 크기가 버킷 제한(프로필 5MB, 맛집 10MB)을 넘으면 400이고 조각을 지운다.
- Storage 오류는 502이며 조각을 남겨 재시도할 수 있다. 브라우저는 네트워크 오류와 5xx를 3회까지 재시도하고, 그래도 실패하면 조각을 지운다.
