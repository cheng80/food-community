import { expect, test } from "vitest";
import { activeApplication, currentCount, programs, readApplications, sampleActions } from "@/lib/payment-sample";

const sushi = programs.find((p) => p.id === "sushi-bento")!;
const count = () => currentCount(readApplications(), sushi);

test("중복 결제는 1건이고 인원은 1명만 는다", () => {
  const first = sampleActions.pay(sushi.id, "샘플 카드");
  const second = sampleActions.pay(sushi.id, "샘플 카드");
  expect(second?.id).toBe(first?.id);
  expect(readApplications().filter((a) => a.programId === sushi.id)).toHaveLength(1);
  expect(count()).toBe(sushi.count + 1);
});

test("두 번 취소해도 상태는 한 번 바뀌고 인원이 돌아오며 다시 결제할 수 있다", () => {
  const paid = activeApplication(readApplications(), sushi.id)!;
  sampleActions.cancel(paid.id);
  const once = readApplications().find((a) => a.id === paid.id);
  sampleActions.cancel(paid.id);
  expect(readApplications().find((a) => a.id === paid.id)).toEqual(once);
  expect(once?.status).toBe("cancelled");
  expect(count()).toBe(sushi.count);
  expect(sampleActions.pay(sushi.id, "샘플 카드")?.id).not.toBe(paid.id);
});

test("정원이 찬 회차와 없는 프로그램은 결제되지 않는다", () => {
  expect(sampleActions.pay("drive-meetup", "샘플 카드")).toBeUndefined();
  expect(sampleActions.pay("nope", "샘플 카드")).toBeUndefined();
});
