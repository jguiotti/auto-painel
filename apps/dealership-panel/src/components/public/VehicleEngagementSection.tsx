"use client";

import { useCallback, useState } from "react";

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
  const [simulationSnapshot, setSimulationSnapshot] =
    useState<FinanceSimulationSnapshot | null>(null);

  const handleSnapshot = useCallback((snapshot: FinanceSimulationSnapshot) => {
    setSimulationSnapshot(snapshot);
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <FinanceSimulator
        vehiclePrice={vehiclePrice}
        onSnapshotChange={handleSnapshot}
      />
      <LeadCaptureForm
        vehicleId={vehicleId}
        simulationSnapshot={simulationSnapshot}
      />
    </div>
  );
}
