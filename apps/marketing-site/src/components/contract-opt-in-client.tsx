"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from "@autopainel/shared/ui";

import {
  submitContractAcceptanceAction,
} from "@/actions/contract-acceptance";
import { PRIVACY_POLICY_VERSION, PLATFORM_TERMS_VERSION } from "@/lib/legal/constants";
import type { PublicContractAcceptancePreview } from "@autopainel/shared/types";

interface ContractOptInClientProps {
  token: string;
  preview: PublicContractAcceptancePreview;
}

export function ContractOptInClient({ token, preview }: ContractOptInClientProps) {
  const [acceptContract, setAcceptContract] = useState(false);
  const [acceptPlatformTerms, setAcceptPlatformTerms] = useState(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  if (preview.alreadyAccepted) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Aceite já confirmado</CardTitle>
          <CardDescription>
            Você já confirmou este contrato. Em breve receberá instruções de pagamento por e-mail.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (preview.isExpired) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Link expirado</CardTitle>
          <CardDescription>
            Este link não é mais válido. Entre em contato com a AutoPainel pelo WhatsApp{" "}
            <strong>+55 13 99743-5851</strong>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Aceites registrados</CardTitle>
          <CardDescription>
            Em breve você receberá as instruções de pagamento por e-mail.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitContractAcceptanceAction({
        token,
        acceptContract,
        acceptPlatformTerms,
        acceptPrivacyPolicy,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  const expiresLabel = preview.expiresAt
    ? new Date(preview.expiresAt).toLocaleString("pt-BR")
    : null;

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Aceite do contrato AutoPainel</CardTitle>
        <CardDescription>
          Olá, <strong>{preview.counterpartyName}</strong>. Revise o contrato e confirme os aceites
          abaixo.
          {expiresLabel ? ` Este link expira em ${expiresLabel}.` : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScrollArea className="h-80 rounded-md border p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {preview.bodyMarkdown}
            </div>
          </ScrollArea>

          <p className="text-sm text-muted-foreground">
            Pagamentos da mensalidade e do setup são feitos <strong>somente via Pix</strong>. A nota
            fiscal será emitida e enviada ao e-mail do titular em até <strong>3 dias corridos</strong>{" "}
            após a confirmação do pagamento.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border border-input"
                checked={acceptContract}
                onChange={(event) => setAcceptContract(event.target.checked)}
              />
              <span>
                Li e aceito o <strong>Contrato SaaS</strong> e o Anexo I — Proposta Comercial. *
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border border-input"
                checked={acceptPlatformTerms}
                onChange={(event) => setAcceptPlatformTerms(event.target.checked)}
              />
              <span>
                Li e aceito os{" "}
                <Link href="/termos-de-uso" className="underline" target="_blank">
                  Termos de Uso
                </Link>{" "}
                da plataforma AutoPainel (versão {PLATFORM_TERMS_VERSION}). *
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border border-input"
                checked={acceptPrivacyPolicy}
                onChange={(event) => setAcceptPrivacyPolicy(event.target.checked)}
              />
              <span>
                Li e aceito a{" "}
                <Link href="/politica-de-privacidade" className="underline" target="_blank">
                  Política de Privacidade
                </Link>{" "}
                da AutoPainel (versão {PRIVACY_POLICY_VERSION}). *
              </span>
            </label>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={
              pending || !acceptContract || !acceptPlatformTerms || !acceptPrivacyPolicy
            }
          >
            {pending ? "Registrando…" : "Confirmar aceites"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
