import type { Metadata } from "next";
import { Suspense } from "react";
import PagoResultadoClient from "./PagoResultadoClient";

export const metadata: Metadata = {
  title: "Resultado del pago",
  robots: { index: false, follow: false },
};

export default function PagoResultadoPage() {
  return (
    <Suspense fallback={null}>
      <PagoResultadoClient />
    </Suspense>
  );
}
