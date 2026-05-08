import type { Metadata } from "next";

import { SimularFinanciamentoGate } from "@/app/(storefront)/simular-financiamento/simular-financiamento-gate";

export const metadata: Metadata = {
  title: "Simular financiamento",
  description: "Simule entrada, prazo e parcela para planejar a compra.",
};

export default function SimularFinanciamentoPage() {
  return <SimularFinanciamentoGate />;
}
