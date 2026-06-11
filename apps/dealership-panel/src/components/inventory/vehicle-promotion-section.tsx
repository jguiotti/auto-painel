"use client";

export interface VehiclePromotionConfig {
  socialEnabled: boolean;
  metaConnected: boolean;
  hasInstagramBusiness: boolean;
  classifiedsEnabled: boolean;
  connectedProviders: Array<"olx" | "webmotors">;
}

export function isVehiclePromotionActionAvailable(
  config: VehiclePromotionConfig,
): boolean {
  const showSocial = config.socialEnabled && config.metaConnected;
  const showClassifieds =
    config.classifiedsEnabled && config.connectedProviders.length > 0;
  return showSocial || showClassifieds;
}

interface VehiclePromotionSectionProps {
  config: VehiclePromotionConfig;
  instagram: boolean;
  facebook: boolean;
  olx: boolean;
  webmotors: boolean;
  onInstagramChange: (value: boolean) => void;
  onFacebookChange: (value: boolean) => void;
  onOlxChange: (value: boolean) => void;
  onWebmotorsChange: (value: boolean) => void;
}

export function VehiclePromotionSection({
  config,
  instagram,
  facebook,
  olx,
  webmotors,
  onInstagramChange,
  onFacebookChange,
  onOlxChange,
  onWebmotorsChange,
}: VehiclePromotionSectionProps) {
  const showSocial = config.socialEnabled && config.metaConnected;
  const showClassifieds =
    config.classifiedsEnabled && config.connectedProviders.length > 0;

  if (!isVehiclePromotionActionAvailable(config)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Divulgação automática</p>
        <p className="text-xs text-muted-foreground">
          Opcional — envie para redes e portais ao salvar o veículo.
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
        </div>
      ) : null}
    </div>
  );
}
