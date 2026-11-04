# Day62 결제 디자인 핸드오프 보완 (04-food-handoff-payment)

> 학습 자료 `nextjs에결제디자인핸드오프`의 7화면에 맞춰 Day61 샘플의 남은 차이만 고쳤다. 실제 결제와 환불은 일어나지 않는다.

03을 04로 복사하는 기본 핸드오프는 Day61에서 끝났다. 새 폴더를 만들지 않았다.

## 바꾼 것

| 파일 | 변경 |
| --- | --- |
| `src/app/programs/[id]/program-view.tsx` | 상세 하단 버튼 `결제하기`를 `수업 참여하기`로 변경. 눌렀을 때 열리는 시트의 제목 `결제하기`는 유지 |
| `src/components/ui/Payment.tsx` | `PaymentCancelSheet` 추가. 기존 `BottomSheet`, `SampleNotice`, `SummaryRow`, `Button`의 조합이며 새 토큰 없음 |
| `src/components/ui/Payment.stories.tsx` | `Cancel Sheet` 스토리 추가. Esc, 닫기, Tab 순환, 포커스 복귀, 더블클릭 1회 처리를 play로 검증 |
| `src/app/me/me-view.tsx` | 결제 취소를 중앙 `Modal`에서 `PaymentCancelSheet`로 교체. 취소 후 사라진 버튼 대신 취소 내역 패널로 포커스 이동. 글 삭제 `Modal`은 그대로 |

`src/lib/payment-sample.ts`는 바꾸지 않았다. 중복 취소는 기존 `sampleActions.cancel`이 막는다.

## 7화면 (http://localhost:3061)

```sh
npm ci
npm run build
npx next start -p 3061
```

| # | 화면 | 주소와 도달 경로 | 모바일 360 | 데스크톱 1280 |
| --- | --- | --- | --- | --- |
| 1 | 메인 배너 | `/` | `web/01-main-banner-mobile.png` | `web/01-main-banner-desktop.png` |
| 2 | 배너 상세 | `/programs/sushi-bento`, 배너 클릭 | `web/02-program-detail-mobile.png` | `web/02-program-detail-desktop.png` |
| 3 | 수업 참여하기 버튼을 눌렀을 때 | `?sheet=payment`, `수업 참여하기` | `web/03-join-sheet-mobile.png` | `web/03-join-sheet-desktop.png` |
| 4 | 결제 완료 | `/programs/sushi-bento/complete`, 동의 후 `샘플 결제 진행` | `web/04-payment-complete-mobile.png` | `web/04-payment-complete-desktop.png` |
| 5 | 결제 내역 탭 | `/me?tab=payments`, `결제 내역 보기` | `web/05-payments-tab-mobile.png` | `web/05-payments-tab-desktop.png` |
| 6 | 결제 취소 바텀시트 | 결제 내역의 `샘플 취소` | `web/06-cancel-sheet-mobile.png` | `web/06-cancel-sheet-desktop.png` |
| 7 | 결제 취소 내역 탭 | `/me?tab=cancels`, 시트의 `샘플 취소` | `web/07-cancels-tab-mobile.png` | `web/07-cancels-tab-desktop.png` |

## 검증 (2026-11-04, 프로덕션 빌드, 포트 3061, Ego 브라우저 새 백그라운드 탭 1개)

| 항목 | 결과 |
| --- | --- |
| `npx tsc --noEmit`, `npx eslint src tests/unit`, `npm run build` | 통과 |
| `npm test` | 72개 통과 |
| `npx vitest run --project storybook src/components/ui/Payment.stories.tsx src/components/ui/Overlay.stories.tsx` | 12개 중 11개 통과. `Cancel Sheet` 포함 `Payment` 9개 통과. `Modal Busy` 1개 실패 (아래 한계) |
| 360 모바일 흐름 | 점검 39개 통과 |
| 1280 데스크톱 흐름 | 점검 39개 통과 |

두 크기에서 같은 점검을 실행했다.

- 샘플 문구: 상세, 시트, 완료, 내역, 취소 시트에 실제 결제·환불이 없다는 문구 표시.
- 동의: 동의 전 `샘플 결제 진행` 비활성, Space로 동의 후 활성.
- 닫기: 결제 시트는 Esc와 닫기 버튼, 취소 시트는 Esc, 닫기 버튼, 바깥 영역으로 닫힘. 닫아도 결제 상태 유지.
- 키보드: 시트를 열면 대화상자로 포커스 진입. 취소 시트에서 Tab이 `닫기`, `샘플 취소`, `닫기`로 순환. 닫으면 연 버튼으로 복귀. 취소 확정 후에는 취소 내역 패널로 이동.
- 중복 취소: 같은 작업 안에서 `샘플 취소`를 두 번 클릭해도 취소 건수는 1건만 증가.
- 배치: 취소 시트는 화면 아래에 붙음. 너비는 360에서 360px, 1280에서 480px. 모든 화면 가로 넘침 0.
- 글 삭제: `내가 쓴 글` 탭의 삭제 확인은 기존 `Modal`로 열림.
- 브라우저 호출: 전체 흐름의 요청과 리소스에서 `/api/*` 0건, 외부 출처 0건.

## 한계

- `Modal Busy` 스토리 실패는 Day61에서 33 원본 `Overlay.tsx`로도 같다고 확인한 기존 문제다. `Overlay.tsx`를 바꾸지 않았고 고치지 않았다.
- `design.pen`은 바꾸지 않았다. 프레임 16·24의 버튼은 `결제하기`로 남아 있고 결제 취소 바텀시트 프레임은 없다. 이 저장소의 디자인 SSOT는 Storybook이며 `Cancel Sheet` 스토리가 이를 담는다. 작업 당시 Pencil 앱에 03 원본이 열려 있어 03 변경 위험을 피했다.
- 실제 터치 기기, 실제 화면 낭독기는 확인하지 않았다. 360은 Ego 브라우저의 기기 에뮬레이션이고 입력은 CDP로 보냈다.
- 제출 페이지 URL은 확인하지 못했다. LMS 자료 제목과 7화면 요구는 외부 감독이 전달한 내용을 사용했고, LMS를 직접 열지 않았다.
- 실제 PG, 결제, 환불, DB, Supabase, Naver, OAuth, Production, Vercel은 건드리지 않았다.
