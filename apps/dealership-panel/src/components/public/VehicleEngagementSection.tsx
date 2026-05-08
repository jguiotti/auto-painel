"use client";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { useCallback, useState } from "react";

import { usePublicDealership } from "@/components/public/PublicDealershipProvider";
import { FinanceSimulator } from "@/components/public/FinanceSimulator";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

interface VehicleEngagementSectionProps {
  vehicleId: string;
  vehiclePrice: number;
}

export function VehicleEngagementSection({
  vehicleId,
  vehiclePrice,
}: VehicleEngagementSectionProps) {
  const dealership = usePublicDealership();
  const showFinanceSimulator = isDealershipFeatureEnabled(
    dealership?.enabled_features,
    "finance_simulator",
  );

  const [simulationSnapshot, setSimulationSnapshot] =
    useState<FinanceSimulationSnapshot | null>(null);

  const handleSnapshot = useCallback((snapshot: FinanceSimulationSnapshot) => {
    setSimulationSnapshot(snapshot);
  }, []);

  return (
    <div
      className={
        showFinanceSimulator ? "grid gap-8 lg:grid-cols-2" : "grid gap-8"
      }
    >
      {showFinanceSimulator ? (
        <FinanceSimulator
          vehiclePrice={vehiclePrice}
          onSnapshotChange={handleSnapshot}
        />
      ) : null}
      <LeadCaptureForm
        vehicleId={vehicleId}
        simulationSnapshot={simulationSnapshot}
        allowFinancingLeadType={showFinanceSimulator}
      />
    </div>
  );
}
