import { PlatformSalesRepBankForm } from "@/components/platform-sales-rep-bank-form";
import {
  fetchOwnSalesRepBankAccounts,
  fetchOwnSalesRepRecord,
} from "@/lib/data/platform-sales-squad-rep-portal";

export const dynamic = "force-dynamic";

export default async function RepDadosPagamentoPage() {
  const [rep, accounts] = await Promise.all([
    fetchOwnSalesRepRecord(),
    fetchOwnSalesRepBankAccounts(),
  ]);

  if (!rep) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dados de pagamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre ou atualize sua chave PIX para receber comissões.
        </p>
      </div>
      <PlatformSalesRepBankForm salesRepId={rep.id} accounts={accounts} />
    </div>
  );
}
