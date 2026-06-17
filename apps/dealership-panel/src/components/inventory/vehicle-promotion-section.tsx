"use client";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

export interface VehiclePromotionConfig {
  socialEnabled: boolean;
  metaConnected: boolean;
  hasInstagramBusiness: boolean;
  enabledClassifiedProviders: ClassifiedsProvider[];
  connectedProviders: ClassifiedsProvider[];
}

export function isVehiclePromotionActionAvailable(
  config: VehiclePromotionConfig,
): boolean {
  const showSocial = config.socialEnabled && config.metaConnected;
  const showClassifieds = config.connectedProviders.length > 0;
  return showSocial || showClassifieds;
}

interface VehiclePromotionSectionProps {
  config: VehiclePromotionConfig;
  instagram: boolean;
  facebook: boolean;
  olx: boolean;
  webmotors: boolean;
  icarros: boolean;
  skipClassifieds: boolean;
  onInstagramChange: (value: boolean) => void;
  onFacebookChange: (value: boolean) => void;
  onOlxChange: (value: boolean) => void;
  onWebmotorsChange: (value: boolean) => void;
  onIcarrosChange: (value: boolean) => void;
  onSkipClassifiedsChange: (value: boolean) => void;
}

export function VehiclePromotionSection({
  config,
  instagram,
  facebook,
  olx,
  webmotors,
  icarros,
  skipClassifieds,
  onInstagramChange,
  onFacebookChange,
  onOlxChange,
  onWebmotorsChange,
  onIcarrosChange,
  onSkipClassifiedsChange,
}: VehiclePromotionSectionProps) {
  const showSocial = config.socialEnabled && config.metaConnected;
  const showClassifieds = config.connectedProviders.length > 0;

  if (!isVehiclePromotionActionAvailable(config) && !showClassifieds) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      {showClassifieds ? (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Classificados</p>
            <p className="text-xs text-muted-foreground">
              Ao salvar, veículos disponíveis com foto são enviados aos portais conectados.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="skip_classifieds_promotion"
              value="true"
              checked={skipClassifieds}
              onChange={(event) => onSkipClassifiedsChange(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Não divulgar em classificados neste cadastro
          </label>
        </div>
      ) : null}

      {isVehiclePromotionActionAvailable(config) ? (
        <>
          <div>
            <p className="text-sm font-medium">Divulgação ao usar «Salvar e divulgar»</p>
            <p className="text-xs text-muted-foreground">
              Opcional — escolha redes e portais específicos nesse botão.
            </p>
          </div>

      {showSocial ? (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="promote_instagram"
              value="true"
              checked={instagram}
              disabled={!config.hasInstagramBusiness}
              onChange={(event) => onInstagramChange(event.target.checked)}
              className="size-4 rounded border-input"
            />
            {config.hasInstagramBusiness
              ? "Postar no Instagram ao salvar"
              : "Instagram indisponível — conecte conta Business em Integrações"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="promote_facebook"
              value="true"
              checked={facebook}
              onChange={(event) => onFacebookChange(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Postar no Facebook ao salvar
          </label>
        </div>
      ) : null}

      {showClassifieds ? (
        <div className="space-y-2">
          {config.connectedProviders.includes("olx") ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="promote_olx"
                value="true"
                checked={olx}
                onChange={(event) => onOlxChange(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Publicar na OLX ao salvar
            </label>
          ) : null}
          {config.connectedProviders.includes("webmotors") ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="promote_webmotors"
                value="true"
                checked={webmotors}
                onChange={(event) => onWebmotorsChange(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Publicar na WebMotors ao salvar
            </label>
          ) : null}
          {config.connectedProviders.includes("icarros") ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="promote_icarros"
                value="true"
                checked={icarros}
                onChange={(event) => onIcarrosChange(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Publicar no iCarros ao salvar
            </label>
          ) : null}
          {config.enabledClassifiedProviders.includes("icarros") &&
          !config.connectedProviders.includes("icarros") ? (
            <p className="text-xs text-muted-foreground">
              iCarros está no seu plano — conecte em Integrações quando o canal estiver disponível.
            </p>
          ) : null}
        </div>
      ) : null}
        </>
      ) : null}
    </div>
  );
}
