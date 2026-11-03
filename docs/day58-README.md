# Day58 네이버 지도 연동

| 단계 폴더 | 범위 |
| --- | --- |
| `25-food-handoff-map` | 핀, 결과, 요약, 주소 상자 컴포넌트와 스토리, 폼 입력 저장소, 장소 페이지 화면 |
| `27-food-naver-map` | SDK 로더(`ncpKeyId`), 지도 컴포넌트, 키 없음·인증 실패 표시 |
| `28-food-naver-local-search` | 검색 BFF, 좌표·HTML 정규화, 검색 화면, 폼 장소 입력 |
| `29-food-naver-reverse-geocoding` | reverse BFF, 지번 조합, 이전 주소 무효화와 늦은 응답 차단 |
| `30-food-map-api` | `name`, `lat`, `lng` migration, 타입·API·폼·상세 전체 연결 |

- 글 제목은 `Restaurant.title`/`place.title`, 장소 이름은 `Restaurant.placeName`/`place.name`이다.
- 기존 행은 좌표를 추정하지 않고 NULL로 둔다. `place_location_required`는 NOT VALID 제약이라 새 행과 수정 행에만 적용되고, 삭제 처리는 좌표 없이 허용한다.
- 등록 버튼은 현재 중심 좌표와 짝이 맞는 주소가 있고 장소명이 있을 때만 켜진다. 서버는 주소와 좌표의 일치를 네이버에 다시 묻지 않으므로, 직접 호출로 주소와 다른 좌표를 저장하면 본인 글에 그대로 저장된다.
- 기본 중심은 서울시청 부근 좌표이며 공식 좌표 문서로 확정하지 못했다. 첫 화면 위치로만 쓰고 저장은 사용자가 고른 좌표만 한다.

키 입력 위치와 재빌드는 `CONNECTION_SETUP.md`에 있다. `NEXT_PUBLIC_*` 값은 빌드에 포함되므로 입력 후 서버를 다시 시작하거나 다시 빌드한다.
