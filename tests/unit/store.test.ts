import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { request, send } from "@/lib/api";
import { actions } from "@/lib/store";

const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("JSON이 아닌 오류 응답과 네트워크 실패도 한국어 오류로 바꾼다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 404 })));
    await expect(request("/x")).rejects.toThrow("요청을 처리하지 못했어요.");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(send("/x", "POST", {})).rejects.toMatchObject({ status: 0, message: "네트워크 연결을 확인해 주세요." });
  });
});

describe("store", () => {
  beforeEach(() => vi.stubGlobal("window", { location: { assign: vi.fn() } }));
  afterEach(() => vi.unstubAllGlobals());

  it("로그아웃 성공 후 bootstrap이 실패해도 성공으로 처리한다", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "/api/bootstrap" ? respond(500, { error: "x" }) : respond(200, { ok: true }))));
    await expect(actions.logout()).resolves.toBeUndefined();
  });

  it("늦게 도착한 이전 refresh가 최신 상태를 덮어쓰지 않는다", async () => {
    let first: (r: Response) => void = () => {};
    const seen = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { first = resolve; }))
      .mockImplementationOnce(async () => respond(200, { loggedIn: true, me: { id: "new", nickname: "새" }, users: [], restaurants: [] }));
    vi.stubGlobal("fetch", seen);
    const older = actions.refresh();
    await actions.refresh();
    first(respond(200, { loggedIn: false, me: { id: "old", nickname: "옛" }, users: [], restaurants: [] }));
    await older;
    expect((await import("@/lib/store")).findUser({ me: { id: "new", nickname: "새" }, users: [] } as never, "new")?.nickname).toBe("새");
  });

  it("프로필 저장 성공 후 bootstrap 실패는 저장 실패가 아니다", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "/api/bootstrap" ? respond(500, {}) : respond(200, { ok: true }))));
    await expect(actions.updateProfile({ nickname: "맛집" })).resolves.toBeUndefined();
    vi.stubGlobal("fetch", vi.fn(async () => respond(502, { error: "프로필을 저장하지 못했어요." })));
    await expect(actions.updateProfile({ nickname: "맛집" })).rejects.toThrow("프로필을 저장하지 못했어요.");
  });

  it("로그인 시작 실패는 호출자에게 전달한다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(502, { error: "구글 로그인 연결을 확인해 주세요." })));
    await expect(actions.login("/")).rejects.toThrow("구글 로그인 연결을 확인해 주세요.");
  });

  it("이 단계에 없는 쓰기 기능은 성공처럼 보이지 않는다", async () => {
    await expect(actions.createRestaurant({ name: "", address: "", content: "", photos: [] })).rejects.toThrow("아직 연결되지");
    await expect(actions.updateRestaurant("x", { name: "", address: "", content: "", photos: [] })).rejects.toThrow("아직 연결되지");
    await expect(actions.deleteRestaurant("x")).rejects.toThrow("아직 연결되지");
  });
});
