"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from "@autopainel/shared/ui";
import { EmptyState } from "@autopainel/shared/components/empty-state";

import { upsertPlatformSalesRepBankAccountAction } from "@/actions/platform-sales-reps";
import {
  maskPixKey,
  type PlatformSalesRepBankAccountRecord,
} from "@/lib/data/platform-sales-squad-shared";

interface PlatformSalesRepBankFormProps {
  salesRepId: string;
  accounts: PlatformSalesRepBankAccountRecord[];
  readOnlyPreview?: boolean;
}

export function PlatformSalesRepBankForm({
  salesRepId,
  accounts,
  readOnlyPreview = false,
}: PlatformSalesRepBankFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "ted">(
    accounts[0]?.payment_method ?? "pix",
  );

  const primary = accounts.find((account) => account.is_primary) ?? accounts[0];

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("sales_rep_id", salesRepId);
    if (primary?.id) {
      formData.set("account_id", primary.id);
    }

    startTransition(async () => {
      const result = await upsertPlatformSalesRepBankAccountAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Dados bancários salvos.");
      router.refresh();
    });
  }

  if (readOnlyPreview && accounts.length === 0) {
    return (
      <EmptyState
        title="Nenhuma forma de pagamento cadastrada"
        description="Cadastre sua chave PIX para receber comissões nos lotes de pagamento."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados para pagamento</CardTitle>
        <CardDescription>
          Informações usadas nos lotes de pagamento. Dados sensíveis ficam mascarados na
          listagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {primary && readOnlyPreview ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Conta principal cadastrada</p>
            <p className="mt-1 text-muted-foreground">
              {primary.payment_method === "pix"
                ? `PIX (${primary.pix_key_type ?? "—"}): ${maskPixKey(primary.pix_key ?? "")}`
                : `TED — ${primary.bank_code ?? "—"} / ${primary.branch ?? "—"}`}
            </p>
          </div>
        ) : null}

        {!readOnlyPreview || accounts.length === 0 ? (
          <form action={handleSubmit} className="space-y-4">
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de pagamento</Label>
              <select
                id="payment_method"
                name="payment_method"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as "pix" | "ted")
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pix">PIX</option>
                <option value="ted">Transferência (TED)</option>
              </select>
            </div>

            {paymentMethod === "pix" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pix_key_type">Tipo de chave PIX</Label>
                  <select
                    id="pix_key_type"
                    name="pix_key_type"
                    defaultValue={primary?.pix_key_type ?? "email"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave aleatória</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX</Label>
                  <Input
                    id="pix_key"
                    name="pix_key"
                    defaultValue={primary?.pix_key ?? ""}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Exibimos apenas os últimos 4 caracteres após salvar.
                  </p>
                </div>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bank_code">Banco</Label>
                  <Input id="bank_code" name="bank_code" defaultValue={primary?.bank_code ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Agência</Label>
                  <Input id="branch" name="branch" defaultValue={primary?.branch ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Conta com dígito</Label>
                  <Input
                    id="account_number"
                    name="account_number"
                    defaultValue={primary?.account_number ?? ""}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account_holder_name">Nome do titular</Label>
                <Input
                  id="account_holder_name"
                  name="account_holder_name"
                  defaultValue={primary?.account_holder_name ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_holder_document">CPF/CNPJ do titular</Label>
                <Input
                  id="account_holder_document"
                  name="account_holder_document"
                  defaultValue={primary?.account_holder_document ?? ""}
                  required
                />
              </div>
            </div>

            <input type="hidden" name="is_primary" value="true" />

            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar dados bancários"}
            </Button>
          </form>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Somente operadores autorizados visualizam dados completos.
        </p>
      </CardContent>
    </Card>
  );
}
