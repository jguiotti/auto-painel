"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  buildDealershipSupportWhatsAppMessage,
  buildPlanUpgradeWhatsAppMessage,
  buildPlatformSupportWhatsAppUrl,
} from "@autopainel/shared/lib/growth-operations/platform-support-whatsapp";
import type { DealershipStockLimitStatus } from "@autopainel/shared/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@autopainel/shared/ui";
import { MessageCircle } from "lucide-react";

import { createDealershipSupportRequestAction } from "@/app/painel/growth-actions";

interface GrowthOperationsContextValue {
  storeName: string;
  storeSlug: string;
  stockLimitStatus: DealershipStockLimitStatus | null;
  openPlanUpgradeDialog: () => void;
  openSupportSheet: () => void;
}

const GrowthOperationsContext = createContext<GrowthOperationsContextValue | null>(null);

export function useGrowthOperations(): GrowthOperationsContextValue {
  const context = useContext(GrowthOperationsContext);
  if (!context) {
    throw new Error("useGrowthOperations must be used within GrowthOperationsProvider");
  }
  return context;
}

interface GrowthOperationsProviderProps {
  children: ReactNode;
  storeName: string;
  storeSlug: string;
  stockLimitStatus: DealershipStockLimitStatus | null;
  showSupportFab?: boolean;
}

export function GrowthOperationsProvider({
  children,
  storeName,
  storeSlug,
  stockLimitStatus,
  showSupportFab = true,
}: GrowthOperationsProviderProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [supportCategory, setSupportCategory] = useState<
    "plan_upgrade" | "technical_support" | "other"
  >("technical_support");
  const [supportMessage, setSupportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openPlanUpgradeDialog = useCallback(() => {
    setFeedback(null);
    setUpgradeOpen(true);
  }, []);

  const openSupportSheet = useCallback(() => {
    setFeedback(null);
    setSupportOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      storeName,
      storeSlug,
      stockLimitStatus,
      openPlanUpgradeDialog,
      openSupportSheet,
    }),
    [storeName, storeSlug, stockLimitStatus, openPlanUpgradeDialog, openSupportSheet],
  );

  async function submitUpgrade() {
    if (!stockLimitStatus) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const result = await createDealershipSupportRequestAction({
      requestType: "plan_upgrade",
      message: upgradeMessage.trim() || null,
      desiredPlanSlug: stockLimitStatus.suggestedUpgradeSlug,
      metadata: { source: "plan_upgrade_dialog" },
    });

    const whatsappMessage = buildPlanUpgradeWhatsAppMessage({
      storeName,
      storeSlug,
      planName: stockLimitStatus.planName,
      eligibleCount: stockLimitStatus.eligibleCount,
      maxActiveVehicles: stockLimitStatus.maxActiveVehicles,
      suggestedUpgradeName: stockLimitStatus.suggestedUpgradeName,
      optionalMessage: upgradeMessage,
    });

    if ("error" in result && result.error) {
      window.open(buildPlatformSupportWhatsAppUrl(whatsappMessage), "_blank", "noopener,noreferrer");
      setFeedback(
        "Abrimos o WhatsApp, mas não conseguimos registrar a solicitação. Se não receber retorno em 1 dia útil, escreva novamente.",
      );
      setSubmitting(false);
      return;
    }

    window.open(buildPlatformSupportWhatsAppUrl(whatsappMessage), "_blank", "noopener,noreferrer");

    if ("success" in result && result.duplicateToday) {
      setFeedback("Já registramos uma solicitação semelhante hoje. Continue no WhatsApp se precisar complementar.");
    } else {
      setFeedback(
        "Solicitação registrada. Continue no WhatsApp — respondemos em até 1 dia útil.",
      );
    }

    setSubmitting(false);
  }

  async function submitSupport() {
    const trimmed = supportMessage.trim();
    if (trimmed.length < 4) {
      setFeedback("Descreva sua solicitação com pelo menos algumas palavras.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const categoryLabel =
      supportCategory === "plan_upgrade"
        ? "Upgrade de plano"
        : supportCategory === "technical_support"
          ? "Suporte técnico"
          : "Outro assunto";

    const result = await createDealershipSupportRequestAction({
      requestType: supportCategory,
      message: trimmed,
      metadata: { source: "support_fab" },
    });

    const whatsappMessage = buildDealershipSupportWhatsAppMessage({
      storeName,
      storeSlug,
      categoryLabel,
      message: trimmed,
    });

    if ("error" in result && result.error) {
      window.open(buildPlatformSupportWhatsAppUrl(whatsappMessage), "_blank", "noopener,noreferrer");
      setFeedback(result.error);
      setSubmitting(false);
      return;
    }

    window.open(buildPlatformSupportWhatsAppUrl(whatsappMessage), "_blank", "noopener,noreferrer");
    setFeedback("Solicitação registrada. Continue no WhatsApp — respondemos em até 1 dia útil.");
    setSubmitting(false);
  }

  const limitLabel =
    stockLimitStatus?.maxActiveVehicles != null
      ? `${stockLimitStatus.eligibleCount} de ${stockLimitStatus.maxActiveVehicles}`
      : null;

  return (
    <GrowthOperationsContext.Provider value={contextValue}>
      {children}

      {stockLimitStatus?.nearLimit && !stockLimitStatus.atLimit ? (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">
              Você está perto do limite do seu plano
              {stockLimitStatus.planName ? ` (${stockLimitStatus.planName})` : ""}.
              {limitLabel ? ` Hoje: ${limitLabel} veículos disponíveis.` : ""}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={openPlanUpgradeDialog}>
              Solicitar upgrade
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Limite de estoque do seu plano</DialogTitle>
            <DialogDescription>
              {stockLimitStatus?.planName
                ? `Plano ${stockLimitStatus.planName}`
                : "Seu plano atual"}{" "}
              {limitLabel ? `· ${limitLabel} veículos disponíveis` : ""}. Nossa equipe responde em
              até <strong>1 dia útil</strong> pelo WhatsApp oficial.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Plano sugerido</p>
              <p className="font-medium">
                {stockLimitStatus?.suggestedUpgradeName ?? "Entre em contato para avaliarmos"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upgrade_message">Observações (opcional)</Label>
              <Textarea
                id="upgrade_message"
                value={upgradeMessage}
                onChange={(event) => setUpgradeMessage(event.target.value)}
                placeholder="Ex.: Preciso cadastrar mais 5 veículos esta semana."
                rows={3}
              />
            </div>
            {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setUpgradeOpen(false)}>
              Agora não
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitUpgrade()}>
              Enviar solicitação no WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={supportOpen} onOpenChange={setSupportOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Falar com a AutoPainel</SheetTitle>
            <SheetDescription>
              Suporte técnico ou upgrade de plano. Respondemos em até 1 dia útil.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support_category">Assunto</Label>
              <select
                id="support_category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={supportCategory}
                onChange={(event) =>
                  setSupportCategory(
                    event.target.value as "plan_upgrade" | "technical_support" | "other",
                  )
                }
              >
                <option value="technical_support">Suporte técnico</option>
                <option value="plan_upgrade">Upgrade de plano</option>
                <option value="other">Outro assunto</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_message">Mensagem</Label>
              <Textarea
                id="support_message"
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                rows={5}
                placeholder="Descreva o que você precisa."
              />
            </div>
            {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
            <Button
              type="button"
              className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
              disabled={submitting}
              onClick={() => void submitSupport()}
            >
              Enviar e abrir WhatsApp
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {showSupportFab ? (
        <Button
          type="button"
          size="icon"
          aria-label="Suporte e upgrade AutoPainel"
          className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a]"
          onClick={openSupportSheet}
        >
          <MessageCircle className="size-6" />
        </Button>
      ) : null}
    </GrowthOperationsContext.Provider>
  );
}