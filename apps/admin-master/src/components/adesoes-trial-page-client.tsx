"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Eye, Inbox, Link2 } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { OnboardingIntakeStatusBadge } from "@autopainel/shared/components/onboarding-intake-status-badge";
import { formatBrazilMobileMasked } from "@autopainel/shared/lib/br/format-input-masks";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@autopainel/shared/ui";

import {
  archiveOnboardingIntakeAction,
  linkOnboardingIntakeToProspectAction,
} from "@/actions/dealership-onboarding-intakes";
import { ContactQuickActions } from "@/components/contact-quick-actions";
import { OnboardingIntakeReviewDialog } from "@/components/onboarding-intake-review-dialog";
import type { DealershipOnboardingIntakeListRow } from "@/lib/data/dealership-onboarding-intakes";
import type { PlatformCommercialLeadRow } from "@/lib/data/platform-commercial-leads-shared";

interface AdesoesTrialPageClientProps {
  rows: DealershipOnboardingIntakeListRow[];
  commercialLeads: PlatformCommercialLeadRow[];
}

function buildQuickWhatsAppMessage(row: DealershipOnboardingIntakeListRow): string {
  return [
    `Olá! Recebemos sua adesão trial AutoPainel — *${row.store_name}* (${row.slug}).`,
    "",
    "Estamos revisando os dados do formulário. Se precisarmos de ajuste em logo, banner ou textos, avisamos por aqui.",
    "",
    `Protocolo: ${row.id}`,
  ].join("\n");
}

export function AdesoesTrialPageClient({
  rows,
  commercialLeads,
}: AdesoesTrialPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [linkIntakeId, setLinkIntakeId] = useState<string | null>(null);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [archiveIntakeId, setArchiveIntakeId] = useState<string | null>(null);
  const [reviewIntakeId, setReviewIntakeId] = useState<string | null>(null);

  const reviewSummary = reviewIntakeId
    ? rows.find((row) => row.id === reviewIntakeId) ?? null
    : null;

  function handleArchive(intakeId: string) {
    startTransition(async () => {
      const result = await archiveOnboardingIntakeAction(intakeId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Adesão arquivada.");
      setArchiveIntakeId(null);
      router.refresh();
    });
  }

  function handleLink() {
    if (!linkIntakeId || !selectedProspectId) {
      return;
    }
    startTransition(async () => {
      const result = await linkOnboardingIntakeToProspectAction(
        linkIntakeId,
        selectedProspectId,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Adesão vinculada ao lead comercial.");
      setLinkIntakeId(null);
      setSelectedProspectId("");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhuma adesão trial ainda"
        description="Quando lojistas enviarem o formulário em autopainel.com.br/adesao-trial, os cadastros aparecem aqui."
        action={{
          label: "Ver leads comerciais",
          href: "/painel/leads-comerciais",
        }}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Subdomínio</TableHead>
              <TableHead>Arquivos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recebido</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium">{row.store_name}</p>
                  {row.legal_representative_name ? (
                    <p className="text-xs text-muted-foreground">{row.legal_representative_name}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <p className="text-sm">{row.contact_email}</p>
                  {row.whatsapp ? (
                    <p className="text-xs text-muted-foreground">
                      {formatBrazilMobileMasked(row.whatsapp)}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <ContactQuickActions
                      email={row.contact_email}
                      phone={row.whatsapp}
                      label={row.store_name}
                      whatsappMessage={buildQuickWhatsAppMessage(row)}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                <TableCell>
                  <Badge
                    variant={row.assets_uploaded > 0 ? "secondary" : "outline"}
                    className={
                      row.assets_uploaded === 0
                        ? "border-amber-700/40 bg-amber-100 font-medium text-amber-950"
                        : undefined
                    }
                  >
                    {row.assets_uploaded}/{row.assets_expected}
                  </Badge>
                </TableCell>
                <TableCell>
                  <OnboardingIntakeStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewIntakeId(row.id)}
                    >
                      <Eye className="mr-1 size-3.5" />
                      Revisar
                    </Button>
                    {row.converted_dealership_id ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/painel/concessionarias/${row.converted_dealership_id}/editar`}
                        >
                          Ver loja
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" asChild>
                          <Link href={`/painel/concessionarias/nova?intake=${row.id}`}>
                            Converter
                          </Link>
                        </Button>
                        {!row.saas_prospect_id ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              setLinkIntakeId(row.id);
                              setSelectedProspectId("");
                            }}
                          >
                            <Link2 className="mr-1 size-3.5" />
                            Vincular lead
                          </Button>
                        ) : null}
                        {row.status !== "converted" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setArchiveIntakeId(row.id)}
                          >
                            <Archive className="mr-1 size-3.5" />
                            Arquivar
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OnboardingIntakeReviewDialog
        intakeId={reviewIntakeId}
        summary={
          reviewSummary
            ? {
                store_name: reviewSummary.store_name,
                slug: reviewSummary.slug,
                contact_email: reviewSummary.contact_email,
                whatsapp: reviewSummary.whatsapp,
                status: reviewSummary.status,
              }
            : null
        }
        open={reviewIntakeId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewIntakeId(null);
          }
        }}
      />

      <Dialog open={linkIntakeId !== null} onOpenChange={(open) => !open && setLinkIntakeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular adesão a lead comercial</DialogTitle>
            <DialogDescription>
              Escolha o lead B2B correspondente a esta adesão trial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lead comercial</Label>
            <Select value={selectedProspectId} onValueChange={setSelectedProspectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead" />
              </SelectTrigger>
              <SelectContent>
                {commercialLeads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.company_name ?? lead.full_name} — {lead.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkIntakeId(null)}>
              Cancelar
            </Button>
            <Button disabled={!selectedProspectId || isPending} onClick={handleLink}>
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={archiveIntakeId !== null}
        onOpenChange={(open) => !open && setArchiveIntakeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar adesão trial?</AlertDialogTitle>
            <AlertDialogDescription>
              A adesão sairá da fila ativa. Você ainda pode consultá-la no histórico do lead
              vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => archiveIntakeId && handleArchive(archiveIntakeId)}
            >
              Arquivar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
