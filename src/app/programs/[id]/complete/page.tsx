import { Suspense } from "react";
import { PageLoading } from "@/components/app/NotFound";
import { isUuid } from "@/lib/validation";
import { CompleteView } from "./complete-view";

export const metadata = { title: "결제 확인" };

export default function CompletePage({ params, searchParams }: PageProps<"/programs/[id]/complete">) {
  return (
    <Suspense fallback={<PageLoading />}>
      {Promise.all([params, searchParams]).then(([{ id }, { paymentId, code }]) =>
        <CompleteView productId={id} paymentId={isUuid(paymentId) && isUuid(id) ? paymentId : undefined} cancelled={code !== undefined} />
      )}
    </Suspense>
  );
}
