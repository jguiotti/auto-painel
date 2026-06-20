import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { PlatformSalesRepLedgerPanel } from "@/components/platform-sales-rep-ledger-panel";
import {
  fetchOwnCommissionLedgerEntries,
  fetchOwnSalesRepBankAccounts,
  fetchOwnSalesRepRecord,
} from "@/lib/data/platform-sales-squad-rep-portal";

export const dynamic = "force-dynamic";

export default async function RepExtratoPage() {
  const [rep, entries, bankAccounts] = await Promise.all([
    fetchOwnSalesRepRecord(),
    fetchOwnCommissionLedgerEntries(),
    fetchOwnSalesRepBankAccounts(),
  ]);

  const hasPix = bankAccounts.some(
    (account) => account.payment_method === "pix" && account.pix_key,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu extrato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe comissões, bônus e estornos por competência.
        </p>
      </div>

      {!hasPix ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-950">Cadastre sua chave PIX</p>
          <p className="mt-1 text-amber-900">
            Informe seus dados de pagamento para receber comissões nos lotes mensais.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/painel/comercial/dados-pagamento">Ir para dados de pagamento</Link>
          </Button>
        </div>
      ) : null}

      <PlatformSalesRepLedgerPanel
        salesRepId={rep?.id ?? ""}
        entries={entries}
        readOnly
      />
    </div>
  );
}
