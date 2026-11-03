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

  it("글 저장 성공 후 bootstrap 실패는 실패가 아니다: 재등록으로 중복 글이 생기지 않게 id를 돌려준다", async () => {
    const input = { title: "맛집", placeName: "장소", address: "서울", lat: 37.5, lng: 127, content: "열 글자가 넘는 후기입니다", imagePaths: [] };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "/api/bootstrap" ? respond(500, {}) : respond(201, { id: "new-id" }))));
    await expect(actions.createRestaurant(input)).resolves.toBe("new-id");
    await expect(actions.updateRestaurant("new-id", input)).resolves.toBeUndefined();
    await expect(actions.deleteRestaurant("new-id")).resolves.toBeUndefined();
  });

  it("쓰기 실패는 호출자에게 전달한다", async () => {
    const input = { title: "맛집", placeName: "장소", address: "서울", lat: 37.5, lng: 127, content: "열 글자가 넘는 후기입니다", imagePaths: [] };
    vi.stubGlobal("fetch", vi.fn(async () => respond(403, { error: "내가 쓴 글만 바꿀 수 있어요." })));
    await expect(actions.createRestaurant(input)).rejects.toThrow("내가 쓴 글만");
    await expect(actions.updateRestaurant("x", input)).rejects.toThrow("내가 쓴 글만");
    await expect(actions.deleteRestaurant("x")).rejects.toThrow("내가 쓴 글만");
  });

  it("상세 조회가 404면 store에서 글을 빼고, 일시 오류면 오류를 전달한다", async () => {
    const restaurant = { id: "a", title: "맛집", placeName: "장소", lat: 37.5, lng: 127, address: "서울", content: "후기", photos: [], photoPaths: [], authorId: "u", createdAt: 1 };
    vi.stubGlobal("fetch", vi.fn(async () => respond(200, restaurant)));
    await actions.loadRestaurant("a");
    vi.stubGlobal("fetch", vi.fn(async () => respond(502, { error: "x" })));
    await expect(actions.loadRestaurant("a")).rejects.toThrow("x");
    vi.stubGlobal("fetch", vi.fn(async () => respond(404, { error: "없는 글입니다." })));
    await expect(actions.loadRestaurant("a")).resolves.toBeUndefined();
  });
});
