// NCP 공식 계약(2026-09 문서)과 키 없는 실제 401 응답으로 만든 mock. 키가 있는 실제 응답은 아직 대조하지 못했다.
// `postman mock run postman/mocks/naver` 또는 `PORT=4610 node postman/mocks/naver/default.js`로 실행한다.
const http = require("node:http");
const fixtures = require("./fixtures.json");

const unauthorized = { error: { errorCode: "200", message: "Authentication Failed", details: "Authentication information are missing." } };
const quota = { error: { errorCode: "400", message: "Quota Exceeded", details: "Quota Exceeded." } };
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json;charset=UTF-8" });
  res.end(JSON.stringify(body));
};
const hasKeys = (req) => req.headers["x-ncp-apigw-api-key-id"] && req.headers["x-ncp-apigw-api-key"];

function search(req, res, url) {
  const query = url.searchParams.get("query");
  const display = Number(url.searchParams.get("display") ?? 1);
  if (!query) return json(res, 400, { errorCode: "SE01", errorMessage: "Incorrect query request" });
  if (!Number.isInteger(display) || display < 1 || display > 5) return json(res, 400, { errorCode: "SE02", errorMessage: "Invalid display value" });
  if (query === "오류401") return json(res, 401, unauthorized);
  if (query === "오류404") return json(res, 404, { errorCode: "SE05", errorMessage: "Invalid search api" });
  if (query === "오류429") return json(res, 429, quota);
  if (query === "오류500") return json(res, 500, { errorCode: "SE99", errorMessage: "System Error" });
  if (query === "오류503") return json(res, 503, { error: { errorCode: "500", message: "Endpoint Error" } });
  if (query === "지연") return setTimeout(() => json(res, 200, { total: 0, start: 1, display: 0, items: [] }), 15000);
  if (query === "깨진응답") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end("<html>bad gateway</html>");
  }
  // ncp 문서의 예시처럼 지정 없는 검색어도 지번 주소와 좌표를 돌려준다. 앱 수동 확인용.
  const items = fixtures.search[query] ?? (query.includes("없") ? [] : [{ title: `<b>${query}</b> 본점`, link: "", category: "음식점", description: "", telephone: "", address: "서울특별시 구로구 구로동 1124", roadAddress: "서울특별시 구로구 디지털로 300", mapx: "1268900000", mapy: "374850000" }]);
  json(res, 200, { lastBuildDate: new Date().toUTCString(), total: items.length, start: 1, display: Math.min(items.length, display), items: items.slice(0, display) });
}

const area = (name) => ({ name, coords: { center: { crs: name ? "EPSG:4326" : "", x: 0, y: 0 } } });

function reverse(req, res, url) {
  const coords = url.searchParams.get("coords") ?? "";
  const [lng, lat] = coords.split(",").map(Number);
  const status = (code, name, message) => ({ code, name, message });
  if (url.searchParams.get("output") !== "json") return json(res, 400, { status: status(100, "invalid request", "output must be json in this mock") });
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return json(res, 400, { status: status(100, "invalid request", "coords") });
  const key = `${lng.toFixed(7)},${lat.toFixed(7)}`;
  if (fixtures.errors[key] === 429) return json(res, 429, quota);
  if (fixtures.errors[key] === 500) return json(res, 500, { status: status(900, "unknown error", "unknown error") });
  if (fixtures.errors[key] === 503) return json(res, 503, { error: { errorCode: "500", message: "Endpoint Error" } });
  const answer = () => {
    const known = fixtures.reverse[key];
    // 문서: 바다 위 좌표는 결과 없음. 지정 없는 좌표는 한국 범위 안이면 좌표로 만든 지번을 돌려준다.
    const inKorea = lng >= 126 && lng <= 130 && lat >= 34 && lat <= 38.6;
    if (fixtures.sea.includes(key) || (!known && !inKorea)) return json(res, 200, { status: status(3, "no results", "no results"), results: [] });
    const data = known ?? { areas: ["서울특별시", "구로구", "구로동", ""], land: { type: "1", number1: String(Math.round((lng * 10000) % 1000) || 1), number2: "" } };
    const region = { area0: area("kr") };
    data.areas.forEach((name, index) => { region[`area${index + 1}`] = area(name); });
    json(res, 200, { status: status(0, "ok", "done"), results: [{ name: "addr", code: { id: "1114010300", type: "L", mappingId: "09140103" }, region, land: { ...data.land, name: "", coords: { center: { crs: "EPSG:4326", x: lng, y: lat } } } }] });
  };
  if (key === fixtures.slow) return setTimeout(answer, 15000);
  answer();
}

// 실제 SDK를 대신하는 브라우저 확인용 가짜. 드래그와 idle만 흉내 내며 실제 SDK 동작을 보증하지 않는다.
const sdk = (keyId) => `(() => {
  const keyId = ${JSON.stringify(keyId)};
  class LatLng { constructor(lat, lng) { this._lat = lat; this._lng = lng; } lat() { return this._lat; } lng() { return this._lng; } }
  const handlers = new WeakMap();
  const Event = {
    addListener(target, name, fn) { const list = handlers.get(target) ?? {}; (list[name] ??= []).push(fn); handlers.set(target, list); return { target, name, fn }; },
    removeListener(l) { const list = handlers.get(l.target)?.[l.name]; if (list) list.splice(list.indexOf(l.fn), 1); },
    trigger(target, name) { (handlers.get(target)?.[name] ?? []).forEach((fn) => fn()); },
  };
  class Map {
    constructor(el, options) {
      this.el = typeof el === "string" ? document.getElementById(el) : el;
      this.center = options.center; this.zoom = options.zoom;
      this.el.dataset.mockMap = "true"; this.el.dataset.mockKeyId = keyId;
      this.el.style.background = "repeating-linear-gradient(45deg,#e8efe4,#e8efe4 12px,#f3f6f0 12px,#f3f6f0 24px)";
      window.__mockNaverMap = this;
    }
    getCenter() { return this.center; }
    setCenter(c) { this.center = c; Event.trigger(this, "center_changed"); setTimeout(() => Event.trigger(this, "idle"), 0); }
    destroy() { this.destroyed = true; }
  }
  class Marker { constructor(options) { this.options = options; if (options.map) options.map.el.dataset.mockMarker = options.position.lat() + "," + options.position.lng(); } setMap() {} }
  window.naver = { maps: { LatLng, Map, Marker, Event, mock: true } };
})();`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/openapi/v3/maps.js") {
    res.writeHead(200, { "content-type": "text/javascript; charset=UTF-8" });
    return res.end(sdk(url.searchParams.get("ncpKeyId") ?? ""));
  }
  if (url.pathname !== "/search/v1/local" && url.pathname !== "/map-reversegeocode/v2/gc") return json(res, 501, { error: "mock에 없는 경로" });
  if (!hasKeys(req)) return json(res, 401, unauthorized);
  return url.pathname === "/search/v1/local" ? search(req, res, url) : reverse(req, res, url);
});
server.listen(process.env.PORT ?? 4610, "127.0.0.1");
