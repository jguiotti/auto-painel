"use client";

import { useState } from "react";

import { PlatformCommercialLeadAttributionSheet } from "@/components/platform-commercial-lead-attribution-sheet";
import { PlatformCommercialLeadsTable } from "@/components/platform-commercial-leads-table";
import type { DealershipAdminRow } from "@/types/dealership-admin";
import type { PlatformCommercialLeadRow } from "@/lib/data/platform-commercial-leads-shared";
import type { PlatformSalesRepListRow } from "@/lib/data/platform-sales-squad-shared";

interface PlatformCommercialLeadsPageClientProps {
  rows: PlatformCommercialLeadRow[];
  salesReps: PlatformSalesRepListRow[];
  dealerships: DealershipAdminRow[];
}

export function PlatformCommercialLeadsPageClient({
  rows,
  salesReps,
  dealerships,
}: PlatformCommercialLeadsPageClientProps) {
  const [attributionLead, setAttributionLead] = useState<PlatformCommercialLeadRow | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleLeadWon(lead: PlatformCommercialLeadRow) {
    setAttributionLead(lead);
    setSheetOpen(true);
  }

  return (
    <>
      <PlatformCommercialLeadsTable rows={rows} onLeadWon={handleLeadWon} />
      <PlatformCommercialLeadAttributionSheet
        lead={attributionLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        salesReps={salesReps}
        dealerships={dealerships}
      />
    </>
  );
}
