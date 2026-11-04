import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPayment } from "../../src/components/ui/PaymentLink";
import { price, product } from "../../src/lib/product";

afterEach(() => vi.unstubAllGlobals());

describe("판매자에게 등록된 결제 링크", () => {
  it("등록 상품과 1,000원을 표시한다", () => {
    expect(product.title).toBe("요리교실 원데이클래스");
    expect(product.amount).toBe(1000);
    expect(price).toBe("1,000원");
  });

  it("판매자 링크를 opener 없이 결제 팝업으로 연다", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    openPayment();
    expect(open).toHaveBeenCalledExactlyOnceWith(
      "https://www.payapp.kr/L/z4nwCC", "_blank", "popup,width=476,height=720,noopener,noreferrer",
    );
  });

  it("팝업이 차단되어도 결제 완료로 처리하지 않는다", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) });
    expect(openPayment()).toBeUndefined();
  });

  it("다운로드한 QR PNG를 포함한다", () => {
    const png = readFileSync(new URL(`../../public${product.qrImage}`, import.meta.url));
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});
