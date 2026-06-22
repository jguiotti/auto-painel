"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, Inbox, Link2 } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { OnboardingIntakeStatusBadge } from "@autopainel/shared/components/onboarding-intake-status-badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import type { DealershipOnboardingIntakeListRow } from "@/lib/data/dealership-onboarding-intakes";
import type { PlatformCommercialLeadRow } from "@/lib/data/platform-commercial-leads-shared";

interface AdesoesTrialPageClientProps {
  rows: DealershipOnboardingIntakeListRow[];
  commercialLeads: PlatformCommercialLeadRow[];
}

export function AdesoesTrialPageClient({
  rows,
  commercialLeads,
}: AdesoesTrialPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [linkIntakeId, setLinkIntakeId] = useState<string | null>(null);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [archiveIntakeId, setArchiveIntakeId] = useState<string | null>(null);

  function handleArchive(intakeId: string) {
    startTransition(async () => {
      const result = await archiveOnboardingIntakeAction(intakeId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Adesão arquivada.");
      setArchiveIntakeId(null);
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
              <TableHead>E-mail</TableHead>
              <TableHead>Subdomínio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recebido</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.store_name}</TableCell>
                <TableCell>{row.contact_email}</TableCell>
                <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                <TableCell>
                  <OnboardingIntakeStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
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
                            Converter em loja
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
