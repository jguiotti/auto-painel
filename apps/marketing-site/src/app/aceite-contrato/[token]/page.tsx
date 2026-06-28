import { fetchContractAcceptancePreviewAction } from "@/actions/contract-acceptance";
import { ContractOptInClient } from "@/components/contract-opt-in-client";

interface ContractAcceptancePageProps {
  params: Promise<{ token: string }>;
}

export default async function ContractAcceptancePage({ params }: ContractAcceptancePageProps) {
  const { token } = await params;
  const result = await fetchContractAcceptancePreviewAction(token);

  if (result.error || !result.preview) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-semibold">Aceite do contrato</h1>
        <p className="mt-3 text-muted-foreground">
          {result.error ??
            "Não foi possível carregar este link. Entre em contato pelo WhatsApp +55 13 99743-5851."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto px-4 py-16">
      <ContractOptInClient token={token} preview={result.preview} />
    </main>
  );
}
