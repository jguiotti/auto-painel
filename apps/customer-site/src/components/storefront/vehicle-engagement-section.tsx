"use client";

import { useCallback, useState } from "react";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { FinanceSimulator } from "@/components/storefront/finance-simulator";
import { LeadCaptureForm } from "@/components/storefront/lead-capture-form";
import { usePublicDealership } from "@/components/storefront/public-dealership-provider";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

interface VehicleEngagementSectionProps {
  vehicleId: string;
  vehiclePrice: number;
  monthlyRatePercent: number;
}

export function VehicleEngagementSection({
  vehicleId,
  vehiclePrice,
  monthlyRatePercent,
}: VehicleEngagementSectionProps) {
  const dealership = usePublicDealership();
  const showFinance = isDealershipFeatureEnabled(
    dealership?.enabled_features,
    "finance_simulator",
  );

  const [simulationSnapshot, setSimulationSnapshot] =
    useState<FinanceSimulationSnapshot | null>(null);

  const handleSnapshot = useCallback((snapshot: FinanceSimulationSnapshot | null) => {
    setSimulationSnapshot(snapshot);
  }, []);

  return (
    <div
      className={`grid gap-8 ${showFinance ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
    >
      {showFinance ? (
        <FinanceSimulator
          vehiclePrice={vehiclePrice}
          monthlyRatePercent={monthlyRatePercent}
          onSnapshotChange={handleSnapshot}
        />
      ) : null}
      <LeadCaptureForm
        vehicleId={vehicleId}
        simulationSnapshot={simulationSnapshot}
        requireSimulation={showFinance}
      />
    </div>
  );
}
