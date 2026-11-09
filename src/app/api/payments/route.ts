import type { PaymentRequest } from "@portone/browser-sdk/v2";
import { api, ApiError, checkOrigin, json } from "@/lib/server/http";
import { paymentDb, portoneConfig, registerPortone } from "@/lib/server/portone";
import { getProduct } from "@/lib/server/products";
import { requireUser } from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";

export async function POST(request: Request) {
  return api(async () => {
    checkOrigin(request);
    const { db, user } = await requireUser();
    const { productId } = await json(request);
    if (!isUuid(productId)) throw new ApiError(400, "올바른 상품을 선택해 주세요.");
    const config = portoneConfig();
    const product = await getProduct(db, productId);
    if (product.price <= 0 || Date.parse(product.event_at) <= Date.now()) {
      throw new ApiError(409, "지금은 결제할 수 없는 상품이에요.");
    }
    const { images: _images, ...snapshot } = product;
    void _images;
    const paymentId = crypto.randomUUID();
    await registerPortone(paymentId, product.price, config);
    const { error } = await paymentDb(config).from("payment_checkout").insert({
      id: paymentId, product_id: product.id, user_id: user.id, amount: product.price, product_snapshot: snapshot,
    });
    if (error) throw new ApiError(502, "주문 정보를 저장하지 못했어요.");
    return {
      paymentId, storeId: config.storeId, channelKey: config.channelKey, orderName: product.name,
      totalAmount: product.price, currency: "KRW", payMethod: "CARD",
      redirectUrl: new URL(`/programs/${product.id}/complete`, config.appUrl).href,
      customData: { productId: product.id, userId: user.id },
      customer: { fullName: "테스트사용자", phoneNumber: "010-0000-1234", email: "tester@example.com" },
    } satisfies PaymentRequest;
  }, 201);
}
