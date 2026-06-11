"use client";

import { useEffect, useState, useTransition } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

import { finalizeMetaPageSelectionAction } from "@/app/painel/integracoes/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MetaPageCandidateRow {
  page_id: string;
  page_name: string;
  instagram_username: string | null;
}

interface MetaPagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function MetaPagePickerDialog({
  open,
  onOpenChange,
  onCompleted,
}: MetaPagePickerDialogProps) {
  const [candidates, setCandidates] = useState<MetaPageCandidateRow[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadCandidates() {
      const supabase = createSupabaseBrowserClient();
      const { data, error: rpcError } = await supabase.rpc(
        "list_dealership_meta_page_candidates",
      );

      if (rpcError) {
        setError("Não foi possível carregar as páginas disponíveis.");
        setCandidates([]);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const parsed = rows
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const record = entry as Record<string, unknown>;
          const pageId = typeof record.page_id === "string" ? record.page_id : null;
          if (!pageId) {
            return null;
          }
          return {
            page_id: pageId,
            page_name:
              typeof record.page_name === "string" ? record.page_name : "Página sem nome",
            instagram_username:
              typeof record.instagram_username === "string"
                ? record.instagram_username
                : null,
          };
        })
        .filter((entry): entry is MetaPageCandidateRow => entry !== null);

      setCandidates(parsed);
      setSelectedPageId(parsed[0]?.page_id ?? null);
      setError(parsed.length === 0 ? "Nenhuma página pendente de seleção." : null);
    }

    void loadCandidates();
  }, [open]);

  function handleConfirm() {
    if (!selectedPageId) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await finalizeMetaPageSelectionAction(selectedPageId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onCompleted?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qual página usar?</DialogTitle>
          <DialogDescription>
            Sua conta tem mais de uma Página do Facebook. Escolha a que representa sua loja.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {candidates.map((candidate) => (
            <label
              key={candidate.page_id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3"
            >
              <input
                type="radio"
                name="meta-page"
                className="mt-1"
                checked={selectedPageId === candidate.page_id}
                onChange={() => setSelectedPageId(candidate.page_id)}
              />
              <span>
                <span className="block text-sm font-medium">{candidate.page_name}</span>
                {candidate.instagram_username ? (
                  <span className="text-xs text-muted-foreground">
                    Instagram: @{candidate.instagram_username}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Sem Instagram Business vinculado
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isPending || !selectedPageId}
            onClick={handleConfirm}
          >
            {isPending ? "Confirmando…" : "Usar esta página"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
