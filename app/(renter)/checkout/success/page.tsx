import { Suspense } from "react";
import { SuccessClient } from "./SuccessClient";
import { Loading } from "@/components/ui/Notice";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="page"><Loading /></div>}>
      <SuccessClient />
    </Suspense>
  );
}
