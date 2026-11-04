# Day62 결제 링크 생성 및 연동하기

학습 자료: https://lms.codebootcamp.co.kr/my/materials/a64483e9-00a0-4326-befc-7e4c130f4de1

사용자가 생성한 페이앱 링크를 Next.js 상품 판매 페이지에 연결했다.

과제: [Day 62 디자인 핸드오프 및 결제 연동하기](https://lms.codebootcamp.co.kr/my/assignments/6fe03a0f-6a25-436e-bcd5-05e38dcc2178). 마감: **2026-11-05 10:00 KST**. 디자인 핸드오프는 [기존 구현 커밋](https://github.com/cheng80/food-community/commit/d796a4aaa872966de0a3a85425160cdf7467c8d7), [실행 방법과 검증](https://github.com/cheng80/food-community/blob/5c2079a919fb5012e7bb9ef5cde0e40881ef912d/docs/day62/README.md)을 참고한다.

- 상품: **요리교실 원데이클래스**, 취미 요리 수업 1건
- 금액: **1,000원**
- 결제 링크: https://www.payapp.kr/L/z4nwCC
- QR: 판매자 관리 화면에서 내려받은 `public/images/payapp/qr-z4nwCC.png`

## 실행

Node.js 24 환경에서 실행한다. 환경변수와 API 키는 필요 없다.

```sh
npm ci
npm run build
npm start
```

http://localhost:3062 에서 확인한다. 개발 중에는 `npm run dev`를 사용한다.

## 구현

`05-design-banner` 폴더가 없어 기존 `04-food-handoff-payment`에서 배너 2종, 로컬 폰트, 디자인 토큰, Button·Icon·Spinner와 Storybook 설정을 가져와 `06-payment-link`를 만들었다. 기존 커뮤니티 앱의 DB·인증·지도·샘플 결제 기능은 이 독립 실습에 필요 없어 복사하지 않았다.

상품명·가격·링크·QR 경로는 `src/lib/product.ts`에서 관리한다. `PaymentLink` 컴포넌트와 스토리를 추가하고 홈 화면에 사용했다.

- 결제 버튼은 클릭 시 페이앱 팝업을 연다. `noopener,noreferrer`로 원래 페이지에 대한 접근을 막는다.
- 팝업 차단에 대비해 일반 새 창 링크도 제공한다.
- QR 버튼은 같은 링크의 QR 이미지를 표시하고 다시 누르면 닫는다. 키보드와 `aria-expanded`를 지원한다.
- 배너를 누르면 결제 영역으로 이동한다. 모바일·데스크톱 배너를 각각 재사용한다.
- 실제 청구 금액을 안내한다. 팝업을 닫았다고 결제 완료로 처리하지 않는다. 결과는 페이앱에서 확인한다.
- 이 실습은 결제 API·웹훅·DB 연동을 추가하지 않는다. 자동 주문 확정이 필요해질 때 서버에서 결제 결과를 검증하는 별도 작업이 필요하다.

## 검증 (2026-11-04 KST)

| 검사 | 결과 |
| --- | --- |
| `npm test` | 4개 통과: 상품·금액, 팝업 주소·보안 옵션, 팝업 차단 시 반환, QR PNG |
| `npx eslint src tests` | 통과 |
| `npm run build`, `npx tsc --noEmit` | 통과 |
| 다운로드한 QR 해독 | macOS Vision으로 `https://www.payapp.kr/L/z4nwCC` 일치 확인 |
| Ego 실제 페이앱 팝업 | 버튼 클릭으로 열림. 상품명, 상점명 패스트메이크, 결제금액 1,000원 확인 |
| QR 열기·닫기 | Ego에서 클릭, 앱 내 브라우저 360px에서 Space 키로 열기 확인 |
| 320·360·1280px | 앱 내 브라우저에서 가로 넘침 없음. 모바일·데스크톱 배너 선택과 QR 이미지 로딩 확인 |
| 데스크톱 Ego | 가로 넘침 없음, 콘솔 error 0건 |

화면 증거: [데스크톱](docs/evidence/desktop.png), [모바일](docs/evidence/mobile.png), [페이앱 결제창](docs/evidence/payapp-checkout.png).

Ego 브라우저의 viewport 설정이 실제 페이지 너비에 반영되지 않아 크기별 검증은 앱 내 브라우저에서 했다. 단위 테스트의 팝업은 mock이며 실제 팝업 증거와 구분한다. Storybook 스토리는 작성했으나 `play` 자동 실행은 하지 않았다.

## 실제 결제 확인

사용자가 네이버페이 결제를 진행했고, 2026-11-04 판매자 관리자 결제현황에서 상품 `요리교실 원데이클래스`, 금액 1,000원, 결제수단 네이버페이(포인트), 상태 **결제완료**를 직접 읽어 확인했다. 목록에 표시된 결제일은 2026-11-04다. 실제 결제는 사용자가 수행했으며 단위 테스트의 mock 결과와 구분한다. 거래번호·연락처·승인정보와 결제 후 관리자 화면은 공개 소스에 넣지 않았다.

결제 승인과 정산 완료는 다르다. 조회 당시 미정산이며 실제 입금은 확인하지 않았다. QR 링크와 표시를 검증했지만 실제 휴대폰 QR 스캔 결제, 환불은 검증하지 않았다. 기존 공개 앱과 판매자 설정은 변경하지 않았다.

## 제출 범위

이 폴더는 독립 실행하는 결제 링크 실습 소스다. 저장소 루트의 기존 커뮤니티 앱과 별도로 실행한다. GitHub에 소스를 게시해도 Vercel에는 자동 배포되지 않는다. 공개 배포·LMS 제출은 하지 않았다. 과제 링크에는 코드 리뷰가 가능한 소스 안내를 사용하고 페이앱 결제창 주소는 참고용으로 첨부한다.
