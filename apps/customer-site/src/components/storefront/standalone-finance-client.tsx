"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@autopainel/shared/ui";
import { Input } from "@autopainel/shared/ui";
import { Label } from "@autopainel/shared/ui";

import { FinanceSimulator } from "@/components/storefront/finance-simulator";

interface StandaloneFinanceClientProps {
  monthlyRatePercent: number;
}

export function StandaloneFinanceClient({
  monthlyRatePercent,
}: StandaloneFinanceClientProps) {
  const [vehiclePrice, setVehiclePrice] = useState(85_000);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--dealer-primary)]">
            Valor do veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="vehicle-price">Preço de referência (R$)</Label>
          <Input
            id="vehicle-price"
            type="number"
            inputMode="decimal"
            min={1}
            step={1000}
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(Number(e.target.value) || 0)}
          />
          <p className="text-sm text-[var(--dealer-fg)]/70">
            Ajuste o valor para simular entrada, prazo e parcela. Para um carro
            específico, abra a página do veículo e use a simulação lá.
          </p>
        </CardContent>
      </Card>
      <FinanceSimulator
        vehiclePrice={Math.max(1, vehiclePrice)}
        monthlyRatePercent={monthlyRatePercent}
      />
    </div>
  );
}
