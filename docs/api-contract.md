# BFF API 계약

브라우저는 `/api/*`와 `/auth/callback`만 호출한다. 쓰기 요청은 같은 출처 `Origin`이 없으면 403이다. 오류 본문은 `{ "error": "한국어 메시지" }`이고 응답은 `Cache-Control: private, no-store`다.

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
| POST | `/api/restaurants` | `{ name, content, address, imagePaths }` | 201 `{ id }` |
| PATCH | `/api/restaurants/{id}` | 같음 | `{ id }`. 타인 글 403 |
| DELETE | `/api/restaurants/{id}` | | `{ ok }`. 타인 글 403 |

- `name` 1~40자, `content` 10~10000자, `address` 1~300자, `imagePaths`는 본인 폴더의 실제 파일 1~5개다. 작성자는 세션 사용자이며 본문의 값은 무시한다.
- 글과 이미지 경로는 `save_place` RPC 한 트랜잭션으로 저장한다. 실패하면 전체가 롤백되고 기존 파일은 지우지 않는다. 커밋 후 교체된 파일만 지운다.
- 다른 글이 쓰는 경로는 409다.

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
