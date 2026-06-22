"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@autopainel/shared/ui";

import { PlatformCommercialLeadAttributionSheet } from "@/components/platform-commercial-lead-attribution-sheet";
import { PlatformCommercialLeadCreateSheet } from "@/components/platform-commercial-lead-create-sheet";
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
  const [createOpen, setCreateOpen] = useState(false);

  function handleLeadWon(lead: PlatformCommercialLeadRow) {
    setAttributionLead(lead);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cadastre leads manualmente ou avance pelo pipeline até contrato e nova loja.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novo lead
        </Button>
      </div>

      <PlatformCommercialLeadsTable rows={rows} onLeadWon={handleLeadWon} />

      <PlatformCommercialLeadCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
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
