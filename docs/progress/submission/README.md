# Day55~61 제출 안내

제출은 사용자가 직접 한다. LMS의 URL 칸에 아래 표의 Day별 URL을 그대로 입력하면 된다. URL 제출만 필요하다. 브랜치를 삭제해도 아래 원본 커밋은 `main` 이력에 남아 URL이 유지된다. 소스는 공개 저장소 https://github.com/cheng80/food-community 에 있고, Day별 설명은 필요할 때 참고한다.

**공통 상태:** 공개 배포 주소는 https://food-community-nine.vercel.app 이고 최종 폴더 `33-food-deploy-pwa`의 `8c7fe0a`를 Git 연결 없이 CLI로 올린 것이다. 저장소는 `main` 하나만 유지하며 단계별 원본 커밋을 그 이력에 보존했다. 현재 앱 파일은 33 기준이며 배포 소스와 문서 이력은 구분한다. 저장소를 공개해도 재배포나 Vercel 연결은 하지 않았다. 검증 글은 모두 소프트 삭제했고, 이후 사용자가 글 1개를 직접 등록했다고 보고했다.

| Day | URL 칸 | 실제 연동에서 남은 것 |
| --- | --- | --- |
| 55 | https://github.com/cheng80/food-community/commit/02f1030d3c3b66043db1cbf51727315cc0dfd558 | 없음 (실제 DB·Storage·OAuth 확인) |
| 56 | https://github.com/cheng80/food-community/commit/7baf5a631832bf2c874a0e627608a10c1ff27f34 | 타인 글 차단 실제 검증 |
| 57 | https://github.com/cheng80/food-community/commit/384dd772076118bf5912c0a4a79db54c3db7f51a | 없음 (실제 검색·reverse·지도 인증 확인) |
| 58 | https://github.com/cheng80/food-community/commit/baa5ec9d0d64e4321569e4d6936d741057656cd7 | 없음 (최종 33을 Production에서 확인) |
| 59 | https://food-community-nine.vercel.app | 없음 (휴대폰 설치·아이콘 실행은 사용자 확인, 스플래시 미확인) |
| 60 | https://github.com/cheng80/food-community/commit/e31d9344d67b8ac612593f64c0f715514bb83598 | 가격·PG·환불 등 정책 결정 (문서 과제는 완료) |
| 61 | https://github.com/cheng80/food-community/commit/d12e66b375e55b58f85b57bd777e303d78ad7e39 | 샘플 UI. 실제 결제·배포 없음 (아래 Day61) |

## Day55 데이터 설계

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/5f7bfb7e-a12a-406e-b39e-ad83531f3bf2
- 커밋: 설계 https://github.com/cheng80/food-community/commit/9358896f10443070d920923ce54d63adb9cfd89a, 근거 정정 https://github.com/cheng80/food-community/commit/ce77379e71349662d1e60ab36402ffcfae20dce8 (https://github.com/cheng80/food-community/commit/6c741724234ec5152a86acad41fcc604cb55f4c3), 실제 적용본 https://github.com/cheng80/food-community/commit/02f1030d3c3b66043db1cbf51727315cc0dfd558
- 참고: 설계 커밋의 README와 migration 파일명, "적용 전" 문구는 실제 적용 전 기준입니다. 실제 version은 `main`의 `supabase/migrations/`에 있습니다.

설명 (필요시 참고):
> 화면 데이터를 추출해 auth.users - profile(1:1) - place(1:N) - place_image(1:N)로 정규화했고 데이터 사전, 관계, Storage, RLS, 적용 순서를 스프레드시트로 정리했습니다. migration은 로컬 Postgres와 PostgREST에서 제약과 RLS를 검증한 뒤 실제 Frankfurt Supabase 프로젝트에 적용했습니다. 테이블 RLS, 버킷, 적용 이력과 익명 조회 허용, 익명 쓰기 차단을 실제로 확인했습니다. 이후 실제 Google 로그인으로 가입 트리거의 profile 1:1 생성과 로그인 후 쓰기, 실제 Storage 저장까지 확인했습니다. 프로필 사진도 실제 버킷 저장과 화면 반영을 확인한 뒤 원래 값으로 되돌렸습니다.

남은 항목: 없음.

## Day56 BFF

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/3a0a19f9-1113-4c8b-adc0-cfd04071df8a
- 커밋: 18 https://github.com/cheng80/food-community/commit/25742872fbbd1f65442759d8e17cc2cdb551de1d, 19 https://github.com/cheng80/food-community/commit/deee784d43b598dec351b292fc56c51243b0b977, 20 https://github.com/cheng80/food-community/commit/76d985fe7943c5300314b893bfebd7e54ad817da, 21 https://github.com/cheng80/food-community/commit/7baf5a631832bf2c874a0e627608a10c1ff27f34, package 이름 정리 커밋: (68850a2, 92e578e, ca4eb0c, dc2f85c)

설명 (필요시 참고):
> 구글 로그인, 프로필, 맛집 CRUD, 소프트 삭제를 Next.js BFF로 단계별 구현했습니다(18, 19, 20, 21). 브라우저는 /api만 호출하고 토큰은 HttpOnly 쿠키에 있으며 서버가 소유권을 검사합니다. 글과 이미지 경로는 RPC 한 트랜잭션으로 저장하고, 10MB 사진은 4MB 조각으로 BFF를 거쳐 올립니다. 로컬 실제 Postgres, PostgREST와 가짜 Auth, Storage로 74개 통합 테스트와 브라우저 시나리오를 통과했습니다. 이후 최종 단계 폴더를 localhost에서 실제 Supabase와 Google 로그인에 연결해 로그인 후 등록, 수정, 사진 교체, 소프트 삭제, 프로필 사진 저장, 익명 쓰기 차단을 확인했습니다. 배포 주소(https://food-community-nine.vercel.app)에서도 로그인, 등록, 수정, 소프트 삭제, 로그아웃을 확인했습니다. 사용자가 1명이라 타인 글 차단은 실제 환경에서 검증하지 않았습니다.

남은 항목: 타인 글 차단 실제 검증.

## Day57 지도 API 연결과 디자인

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/656f75c5-3909-4639-93e6-95e7419cb6e6
- 커밋: https://github.com/cheng80/food-community/commit/384dd772076118bf5912c0a4a79db54c3db7f51a, package 이름 정리 4208ffc

설명 (필요시 참고):
> 네이버 지역 검색, Reverse Geocoding, Maps SDK 계약을 공식 문서로 확인하고 Postman collection과 mock으로 요청·응답 단언 16개를 통과했습니다. 실제 NCP는 키 없는 인증 실패 응답에 더해, 키를 넣은 지역 검색 HTTP 200과 좌표 정규화, reverse status.code 0과 지번 조합, 허용 localhost의 지도 SDK 인증 성공까지 확인했습니다. design.pen에 장소 입력, 검색, 결과 없음, 지도 위치 선택, 상세 미니지도, 데스크톱 화면을 추가했습니다.

남은 항목: 없음. 실제 호출 결과는 https://github.com/cheng80/food-community/blob/main/docs/progress/evidence/naver-live.md 에 있습니다.

## Day58 지도 연동

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/90d499f6-2527-49a4-ae01-81be07825953
- 커밋: 25 https://github.com/cheng80/food-community/commit/6f872b495912c63485df63ac05ccc8c695644ae2, 27 https://github.com/cheng80/food-community/commit/b8db484e5c18ff93487503d08498bc16576f4fbb, 28 https://github.com/cheng80/food-community/commit/23a6fb190573065978f08a1757e4a75d34254fcb, 29 https://github.com/cheng80/food-community/commit/1b267c4970729496558260048a7512b7439878f9, 30 https://github.com/cheng80/food-community/commit/1c0f17ca5cdc354d04114ea4f48442c9f600b38e, 실제 SDK 첫 `idle` 수정 https://github.com/cheng80/food-community/commit/baa5ec9d0d64e4321569e4d6936d741057656cd7, package 이름 정리 커밋: (79af19f, a5f0985, 4a2f19e, a551c33, bfc6d3b)

설명 (필요시 참고):
> 지도 SDK, 지역 검색 BFF, reverse BFF, 장소명·좌표 저장을 단계별로 구현했습니다(25, 27, 28, 29, 30). 검색 결과의 HTML을 지우고 좌표를 검증하며, 지도를 움직이면 이전 주소를 곧바로 버려 잘못된 주소 저장을 막습니다. 로컬 Postgres와 PostgREST, mock 네이버, 가짜 SDK로 단위 68개, 통합 92개, 브라우저 시나리오를 통과했습니다. 이후 실제 키로 서버 helper의 지역 검색과 reverse 성공, 허용 localhost의 임시 페이지에서 실제 지도 컴포넌트의 인증, 타일, 마커, 드래그를 확인했습니다. 이 과정에서 실제 SDK가 지도 생성 시 idle을 보내지 않는 결함을 찾아 30과 최종 33 폴더에서 수정했습니다. 수정의 실제 SDK 확인은 33에서 했습니다. 이후 최종 단계 폴더를 localhost에서 실제 Supabase와 Google 로그인에 연결해 실제 앱 화면의 검색, 지도 드래그 후 Reverse, name·lat·lng 저장, 상세 지도와 마커를 확인했습니다. 배포 주소(https://food-community-nine.vercel.app)에서도 같은 흐름을 확인했습니다.

남은 항목: 없음.

## Day59 배포 준비와 PWA

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/10b249f2-a8dd-4363-8718-c7c75e390963
- 커밋: 31 https://github.com/cheng80/food-community/commit/d79ab6c7a47ff9439760a485be4ea59abe6a7d14, 33 https://github.com/cheng80/food-community/commit/fa4de4c97a36fdad4d9824b96f05952f41c9d498, 실제 SDK 첫 `idle` 수정 https://github.com/cheng80/food-community/commit/384cf11ac3085cbedfbac682304126c2faaba067, 함수 지역 `fra1` https://github.com/cheng80/food-community/commit/d7b3b239ca48b520a632433837463ff1fa402a7e, 권한과 migration 버전 https://github.com/cheng80/food-community/commit/02f1030d3c3b66043db1cbf51727315cc0dfd558, 배포 소스 https://github.com/cheng80/food-community/commit/8c7fe0a96620f6f3b55a0fb78837bdf0df3b66f7, 배포 결과 문서 https://github.com/cheng80/food-community/commit/226d27b5df6ebc83793c1cc92e4ff79a05288d19, 설치 보고 문서 https://github.com/cheng80/food-community/commit/9e494ae228faf2287850c500b5df6cc978f718e9, 그 밖에 package 이름 정리 ef63b9c·192895c, 업로드 검증용 AI 사진 6a56a86, 문서 427c241
- 배포 주소: https://food-community-nine.vercel.app (`dpl_BP6v8ou7CjpMxYav8gSPT2sZ2RqP`, 소스 8c7fe0a)

설명 (필요시 참고):
> Next.js 앱을 Vercel에 Git 연결 없이 CLI로 배포했습니다(https://food-community-nine.vercel.app, 함수 지역 fra1). manifest, 아이콘, 메타데이터, Android 설치 배너와 iOS Safari 안내 시트를 구현했습니다. 배포 주소에서 Google 로그인, 4MB 조각으로 나눈 정확히 10,485,760바이트 테스트 파일 업로드와 실제 Storage 병합, AI 생성 음식 사진 2장 저장, 네이버 검색·Reverse·지도, 수정, 소프트 삭제, 로그아웃을 확인했습니다. 10MB 파일은 PNG에 0을 덧붙인 테스트 파일이고 실제 10MB 음식 사진은 올려 보지 않았습니다. 데스크톱 브라우저에서 manifest와 설치 조건 오류가 없음을 확인했고, 공개 앱을 휴대폰 홈 화면에 설치해 아이콘으로 정상 실행되는 것과 글 1개 등록을 직접 확인했습니다. 스플래시 화면은 따로 확인하지 않았습니다.

남은 항목: 없음. 스플래시 화면은 확인하지 않았습니다.

## Day60 PRD 개정

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/b9da3e39-7d93-460a-88cb-b28b76eb2df9
- 커밋: https://github.com/cheng80/food-community/commit/e31d9344d67b8ac612593f64c0f715514bb83598 (기준본 6c6be33, `main` 이력에 보존). 원본 v0.3은 기준본 커밋에 그대로 있습니다.

설명 (필요시 참고):
> PRD를 v0.4로 개정했습니다. 맛집 강연·모임 유료 프로그램을 메인 배너, 상세, 결제 시트, 결제 완료, 마이 페이지 결제·취소 내역 흐름으로 기획하고 신청 상태와 정원 경합, 결제 실패, 중복 결제, 취소 정합성, 개인정보 수락 기준을 정리했습니다. 전략 가정을 반박하고 시범 운영으로 보완했으며, 가격과 PG, 환불 규정은 열린 질문으로 남겼습니다. 지도 요구는 카카오에서 네이버로 바꿨습니다. 결제 코드는 구현하지 않았습니다.

남은 항목: 가격, PG, 환불 규정 등 열린 질문 결정.

## Day61 배너 만들기 및 디자인 만들기

- 제출 페이지: https://lms.codebootcamp.co.kr/my/assignments/11ae3dbd-b818-47bb-8c0a-0e5506d59294 (외부 감독이 로그인 LMS에서 확인. 미제출, 마감 없음)
- 커밋: 디자인 https://github.com/cheng80/food-community/commit/ce56aacf8755ccc76fce8cc43baf19662bc96201, 핸드오프 https://github.com/cheng80/food-community/commit/d12e66b375e55b58f85b57bd777e303d78ad7e39
- 배포 없음: 04는 공개 저장소의 소스만 있고 배포하지 않았다. 공개 앱(33)에는 결제 화면이 없으니 배포 주소를 Day61 근거로 쓰지 않는다.

설명 (필요시 참고):
> 숨은 맛집 커뮤니티 PRD v0.4를 기준으로 유료 요리 수업 배너와 결제 화면을 디자인하고 반응형 웹 샘플로 옮겼습니다. 도시락과 초밥 5개, 소스통 2개, 종이 질감으로 배너를 구성해 Pencil에서 720x360과 2480x806 정확 규격으로 내보냈습니다. 이미지는 GPT 이미지 생성으로 만들었고 프롬프트를 함께 넣었습니다. 기존 Pencil의 컬러, 타이포, 컴포넌트를 재사용해 메인 배너, 배너 상세, 결제하기 시트, 결제 완료, 마이 페이지 결제 내역·취소 내역·내가 쓴 글 탭, 프로필 설정까지 8화면을 만들었습니다. 결제는 화면 흐름만 보여 주는 샘플이며 실제 결제와 환불은 일어나지 않습니다. 가격과 환불 규정은 예시이고 PG와 정책은 아직 정하지 않았습니다. 디자인은 https://github.com/cheng80/food-community/commit/ce56aacf8755ccc76fce8cc43baf19662bc96201, 코드는 https://github.com/cheng80/food-community/commit/d12e66b375e55b58f85b57bd777e303d78ad7e39 에 있습니다. 배포하지 않았으니 실행 방법은 커밋의 docs/day61/README.md를 봐 주세요.

한계: `Payment` 스토리 8개 통과, `Modal Busy` 스토리 1개 실패(33 원본 `Overlay.tsx`에서도 동일). 가격·PG·환불 등 정책 결정은 Day60과 같이 열려 있다.

남은 항목: 사용자 LMS 직접 제출.
