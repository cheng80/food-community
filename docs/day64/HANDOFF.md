# Day 64 핸드오프

2026-11-10 기준. 작업 대상은 `food-community` 저장소의 `main`이다. 학습 작업공간에서는 `publish/food-community`에 있다. Day 64 취소 동기화와 팝업 딤 수정 위에 Day 66 승인 웹훅을 추가해 [공개 앱](https://food-community-nine.vercel.app)에 [배포](../deploy.md)했다. 문서 push는 자동 배포를 시작하지 않는다.

## 어디서 이어갈지

| 작업 | 시작점 |
| --- | --- |
| 상품 데이터와 이미지 | [마이그레이션](../../supabase/migrations/), [상품 등록 SQL](register-product.sql), [Day 64 자료와 검증](README.md) |
| 상품 목록·상세와 결제 화면 | [상품 API](../../src/app/api/products/), [프로그램 화면](../../src/app/programs/) |
| 테스트 주문·승인 확인 | [결제 API](../../src/app/api/payments/), [포트원 검증](../../src/lib/server/portone.ts), [결제 규칙](../../.claude/rules/payment.md) |
| 환경변수와 배포 | [로컬 설정 예시](../../.env.example), [Vercel 절차](../deploy.md) |

기존 Supabase에 Day 64 마이그레이션 3개와 공개 샘플 상품이 적용돼 있다. 재검증에 상품 재등록은 필요 없다. V2 API Secret에 만료가 설정돼 있으므로 재검증 전 콘솔에서 만료일을 확인한다. 교체가 필요하면 로컬과 Vercel Production의 `PORTONE_API_SECRET`을 함께 갱신하고 재배포한다. 키 값은 저장소나 로그에 남기지 않는다.

## 재현 순서

1. Node.js 24에서 `npm ci` 후 [로컬 실행 설정](README.md#포트원-v2-카드-테스트)을 따른다. `npm test`, `npm run lint`, `npm run build`로 확인한다.
2. 브라우저는 `ego-browser skill`로 설치 버전의 안내를 확인한 뒤 `ego-browser nodejs`로 작업 전용 Space를 만들어 백그라운드에서 진행한다. Chrome을 별도로 열지 않는다. Google 로그인이나 카드 인증이 필요하면 Ego의 `handOff()`로 사용자에게 넘긴다.
3. 공개 목록·상세와 가격을 확인한다. 새 승인이 필요한 경우에만 사용자가 테스트 채널에서 직접 승인한다. 앱 완료 화면, 포트원 `TEST`·`PAID`, Supabase의 승인 1건과 스냅샷을 대조한다. 콜백이 끊기면 새 결제를 만들기 전에 기존 결제를 같은 번호로 확인한다.
4. 테스트여도 실제 카드 승인이 발생할 수 있다. 정리할 결제는 [포트원 콘솔 또는 V2 API](https://developers.portone.io/opi/ko/integration/cancel/v2/readme?v=v2)에서 결제 건을 대조한 뒤 취소한다. 제휴 간편결제는 [자동 취소를 기대하지 않는다](https://help.portone.io/content/test-mode-cancel). 기존 두 건은 이미 전액 취소했고 네이버페이·현대카드 웹 반영까지 확인했다.

## 남은 범위

- 취소 동기화는 공개 배포에 연결했다. [웹훅 연결 및 재전송 검증](README.md#취소-웹훅-연결)을 참고한다.
- 완료 화면 없이 승인 웹훅으로 결제를 기록하는 흐름은 [Day 66](../day66/README.md)에서 이어간다.
- 운영 채널 전환, 수업 정원·중복 신청 처리, 실제 정산, LMS 제출은 이번 범위에 포함되지 않았다.
