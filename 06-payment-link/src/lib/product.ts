export const product = {
  title: "요리교실 원데이클래스",
  amount: 1000,
  paymentUrl: "https://www.payapp.kr/L/z4nwCC",
  qrImage: "/images/payapp/qr-z4nwCC.png",
} as const;

export const price = `${product.amount.toLocaleString("ko-KR")}원`;
