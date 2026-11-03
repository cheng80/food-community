# Day61 결제 디자인 (03-food-design-payment)

> 유료 강연·모임 결제 화면 디자인과 배너. 실제 결제·PG·환불 정책은 범위가 아니다. 화면의 가격·규정은 샘플이다.

## 폴더 계보

| 단계 | 출처 | 내용 |
| --- | --- | --- |
| 1 | `02-food-pm-skills-prd-update` (`.git` 제외 실제 복사) | `02-prd.md` v0.4. 원본과 바이트 동일 |
| 2 | `33-food-deploy-pwa` HEAD `9e494ae` (`git archive`) | `design.pen`, `src`, `.storybook`, 토큰·디자인 문서 보강. 02의 PRD는 덮어쓰지 않음 |

- 제외: `.git`, `.env.local`, `.vercel`, `.next`, `node_modules`, `tsconfig.tsbuildinfo`, `references`, `postman`, `supabase`, Day55~59 문서·렌더.
- 원격은 상속하지 않았다. 독립 로컬 repo이며 remote가 없다. 원본 02·33은 변경하지 않았다.
- `package.json`, `package-lock.json` root name은 `03-food-design-payment`.

## Pencil 변경 (`design.pen`)

pen.dev 앱 + Pencil MCP `execute`로 편집하고 앱의 File > Save로 저장했다. 렌더는 Pencil `Export`로 만들었다. 기존 프레임 44개를 유지하고 13개를 추가해 57개다.

| 프레임 | 내용 | 렌더 |
| --- | --- | --- |
| 15 메인 (프로그램 배너) | 01 메인 복사 + 배너 | `renders/15-main-banner.png` |
| 16 배너 상세 (프로그램) | 대표 이미지, 일시·장소·정원·참가비, 취소 규정, 식당과의 금전 관계 | `renders/16-program-detail.png` |
| 17 상세 + 결제하기 시트 | 기존 `bottom-sheet/default` 인스턴스 | `renders/17-detail-payment-sheet.png` |
| 18 결제 완료 (샘플) | 신청 요약, 결제 내역 이동 | `renders/18-payment-complete.png` |
| 19 마이 · 결제 내역 탭 | 샘플 취소 버튼 | `renders/19-my-payments-tab.png` |
| 20 마이 · 취소 내역 탭 | 취소 완료, 환불 실패 상태 | `renders/20-my-cancels-tab.png` |
| 21 마이 · 내가 쓴 글 탭 | 05 마이의 Post Row 재사용 | `renders/21-my-posts-tab.png` |
| 22 마이 · 프로필 설정 활성화 | 05 마이의 Profile Settings 재사용 | `renders/22-my-profile-settings.png` |
| 23~25 데스크톱 1280 | 메인, 상세+시트, 마이 2:3 | `renders/23~25-*.png` |
| UI / Payment | 새 컴포넌트 (아래) | `renders/ui-payment.png` |
| UI / Program Banner | 정확 규격 배너 프레임 2개 | `banners/` |

### 재사용과 새 컴포넌트

- 재사용: `top-navigation`, `bottom-sheet`, `button`, `radio`, `checkbox`, `badge`, `text-field`, `card`, 텍스트 컴포넌트(`heading-*`, `body-*`, `label-*`), 아이콘, Post Row, Profile, Profile Settings.
- 새 컴포넌트는 기존 컴포넌트 영역(`UI / Map & Place` 오른쪽)에 뒀다: `program/hero/mobile`, `program/hero/desktop`, `payment/sample-notice`, `program/info-row`, `payment/summary-row`, `payment/history-item/{paid,cancelled,refund-failed}`, `tab-navigation/3-tabs`, `program/banner/720x360`, `program/banner/2480x806`.
- 새 색상·타이포·간격 변수는 만들지 않았다.

### 토큰 검토

파일 JSON으로 문서 전체를 검사했다.

- `fill`·`stroke`의 하드코딩 색상: 0건. 새 프레임 13개의 raw 텍스트: 0건 (모두 기존 텍스트 컴포넌트 인스턴스).
- 리팩토링: `Color Palette — Primitives` 캡션 텍스트 168개의 숫자 `fontSize`·`fontWeight`를 `$font-size-*`, `$font-weight-*`로 묶었다. 시각 변화 없음(Pencil 렌더 확인).
- 남긴 항목: 같은 캡션 중 13px 텍스트는 대응 토큰이 없어 값을 유지했다. `04 로그인`의 Google 버튼은 브랜드 가이드 Roboto라 예외다.

## 배너와 이미지 출처

외부 감독이 내장 `image_gen`(GPT)으로 생성해 인계했다. 프롬프트와 출처는 `public/images/program/prompts.json`에 있고, 생성 원본 PNG는 가공 없이 `public/images/program/`에 그대로 복사했다.

| 파일 | 크기 | 용도 |
| --- | --- | --- |
| `banner-mobile-v1.png` | 1774×887 (2:1) | 720×360 프레임의 이미지 fill |
| `banner-desktop-v1.png` | 2200×715 (약 3.077:1) | 2480×806 프레임의 이미지 fill |
| `bento-v1.png`, `sushi-five-v1.png`, `sauce-pots-two-v1.png`, `paper-texture-v1.png` | 1254², 1672×941 | 상세 대표 이미지 합성(`program/hero/*`) |

- 정확 규격 결과: `banners/banner-720x360.png`(720×360), `banners/banner-2480x806.png`(2480×806). Pencil `Export`로 내보냈고 `file`로 크기를 확인했다. 비율이 같아 왜곡이 없다.
- 카피 `심심한 주말 놓치지 아까운 기회`, CTA `요리 수업 알아보기`는 배너 이미지에 들어 있다. 코드에서는 링크 이름으로 같은 문구를 제공한다.
