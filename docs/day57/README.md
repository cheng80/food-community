# Day57 지도 API 연결 준비와 디자인

## 범위와 상태

| 항목 | 상태 | 근거 |
| --- | --- | --- |
| 공식 계약 확인 | 완료 | 아래 표. 2026-11-03 공식 문서 직접 확인 |
| Postman collection, 환경, mock | 완료 | `postman/`, `docs/progress/evidence/day57-postman.log` |
| 실제 NCP 인증 경계 | 키 없이 확인 | 검색·reverse 401, SDK 스크립트 200 |
| 키가 필요한 실제 검색·reverse·지도 인증 | **미완료** | 키 없음 |
| `design.pen` 지도 화면 | 완료 | 원본 34개 프레임 유지, 새 프레임 10개, `docs/day57/renders/` |

## 공식 계약

| API | 요청 | 인증 헤더 |
| --- | --- | --- |
| 지역 검색 | `GET https://naverapihub.apigw.ntruss.com/search/v1/local?query=&display=5&start=1&format=json` | `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY` |
| Reverse | `GET https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=경도,위도&orders=addr&output=json` | `x-ncp-apigw-api-key-id`, `x-ncp-apigw-api-key` |
| Maps JS SDK | `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=공개ID` | 없음. 공개 ID만 브라우저에 노출 |

- 구형 `openapi.naver.com`과 `X-Naver-*` 헤더는 쓰지 않는다. SDK 파라미터는 `ncpClientId`가 아니라 `ncpKeyId`다.
- 검색 `display`는 1~5, 오류는 `SE01`~`SE06`, `SE99`다. `mapx`, `mapy`는 문자열이며 문서는 WGS84 기준이라고만 적고 자릿수를 정하지 않는다. 실제 응답을 키 없이 볼 수 없으므로 원본 소수와 1e7배 정수를 모두 안전하게 해석한다.
- Reverse는 HTTP 200 안에 `status.code`가 있다. 0은 성공, 3은 결과 없음(바다 포함), 100은 요청 오류, 900은 서버 오류다. 지번은 `region.area1~4.name`, `land.type`(2는 산), `land.number1`, `land.number2`로 조합한다. 세종시는 `area2`가 비어 있다.
- 공통 오류: 401 인증 실패, 429 할당량 초과. 콘솔에서 API를 선택하지 않아도 429가 난다.
- 키 없는 실제 응답: `{"error":{"errorCode":"200","message":"Authentication Failed","details":"Authentication information are missing."}}`
- 공개 API 탐색 Orbit은 이전 조사에서 Naver 후보가 없었고, Postman 조직 검색은 CLI 미로그인으로 건너뛰었다. 계약은 위 공식 문서를 근거로 삼았다.

## Postman

```sh
postman collection lint postman/collections/naver-maps
postman mock run postman/mocks/naver --no-history --port 4610
postman collection run postman/collections/naver-maps -e postman/environments/naver-mock.environment.yaml
```

키를 받은 뒤 실제 검증은 값을 파일에 쓰지 않고 실행 시 전달한다.

```sh
postman collection run postman/collections/naver-maps -e postman/environments/naver-live.environment.yaml \
  --env-var naver_search_client_id="$NAVER_SEARCH_CLIENT_ID" --env-var naver_search_client_secret="$NAVER_SEARCH_CLIENT_SECRET" \
  --env-var naver_map_client_id="$NEXT_PUBLIC_NAVER_MAP_CLIENT_ID" --env-var naver_map_client_secret="$NAVER_MAP_CLIENT_SECRET" \
  --env-var naver_map_public_id="$NEXT_PUBLIC_NAVER_MAP_CLIENT_ID"
```

mock 통과는 요청과 단언 로직을 확인할 뿐 실제 NCP 동작을 보증하지 않는다. 설치된 CLI 1.69.0에는 `postman simulation`이 없어 mock과 BFF 통합으로 대신한다.

## 디자인

`design.pen`을 pen.dev 앱에서 직접 수정해 저장했다. 기존 토큰과 컴포넌트를 재사용했다.

| 프레임 | 내용 | 렌더 |
| --- | --- | --- |
| UI / Map & Place | `map/center-pin`, `map/mini`, `place/result-item`, `place/summary`, `place/address-box/*` | `renders/ui-map-place.png` |
| 07 등록 | 글 제목과 장소 분리, `장소 입력` 버튼 | `renders/07-form-place-input.png` |
| 07-1 등록 | 장소 선택 후 요약과 미니지도 | `renders/07-1-form-place-selected.png` |
| 08 장소 등록 | 검색 시작, 지도에서 직접 고르기 | `renders/08-place-search-start.png` |
| 09 검색 결과 | 장소명, 지번 주소 목록, 직접 입력 | `renders/09-place-search-results.png` |
| 10 결과 없음 | 지도에서 직접 입력 | `renders/10-place-search-empty.png` |
| 11 위치 선택 | 중심 고정 핀, 드래그 안내, 장소명, 주소 box, `이 위치로 등록` | `renders/11-map-select.png` |
| 12 주소 없음 | 바다·결과 없음, CTA 비활성 | `renders/12-map-select-no-address.png` |
| 13 상세 | 사진 아래 장소명·주소·미니지도 | `renders/13-detail-mini-map.png` |
| 14 데스크톱 1280 | 왼쪽 검색, 오른쪽 지도 | `renders/14-place-desktop-1280.png` |

지도 이미지는 기존 시안의 `generated.png`이고 실제 SDK 화면이 아니다. 시안의 주소와 장소명은 예시 값이다.
