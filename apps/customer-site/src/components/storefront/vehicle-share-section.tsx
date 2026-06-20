"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";
import {
  buildFacebookShareUrl,
  buildShareUrlWithUtm,
  buildWhatsAppShareUrl,
} from "@autopainel/shared/lib/share/build-share-url-with-utm";
import { cn } from "@autopainel/shared/lib/utils";

import { formatBrl } from "@/lib/format/format-brl";

type ShareChannel =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "copy_link"
  | "native_share";

interface VehicleShareSectionProps {
  vehicleSlug: string;
  brand: string;
  model: string;
  version?: string | null;
  modelYear: number;
  price: number;
  className?: string;
}

interface ShareChannelConfig {
  id: ShareChannel;
  label: string;
  icon: ReactNode;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

export function VehicleShareSection({
  vehicleSlug,
  brand,
  model,
  version,
  modelYear,
  price,
  className,
}: VehicleShareSectionProps) {
  const [pageUrl] = useState(() =>
    typeof window !== "undefined" ? (window.location.href.split("#")[0] ?? "") : "",
  );
  const [canNativeShare] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const vehicleTitle = useMemo(() => {
    const base = `${brand} ${model}${version ? ` ${version}` : ""}`;
    return `${base} (${modelYear})`;
  }, [brand, model, modelYear, version]);

  const shareText = useMemo(
    () => `Confira ${vehicleTitle} por ${formatBrl(price)}:`,
    [price, vehicleTitle],
  );

  useEffect(() => {
    pushAutopainelAnalyticsEvent({
      ap_event: "vehicle_detail_view",
      ap_event_category: "engagement",
      ap_event_label: vehicleSlug,
    });
  }, [vehicleSlug]);

  const trackShare = useCallback(
    (channel: ShareChannel) => {
      pushAutopainelAnalyticsEvent({
        ap_event: "vehicle_share_click",
        ap_event_category: "engagement",
        ap_event_label: channel,
        ap_vehicle_slug: vehicleSlug,
      });
    },
    [vehicleSlug],
  );

  const getShareUrl = useCallback(
    (medium: string) => {
      if (!pageUrl) {
        return "";
      }
      return buildShareUrlWithUtm(pageUrl, {
        medium,
        content: vehicleSlug,
      });
    },
    [pageUrl, vehicleSlug],
  );

  async function copyShareLink(channel: ShareChannel) {
    const url = getShareUrl(channel);
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(
        channel === "instagram"
          ? "Link copiado. Cole no Instagram."
          : channel === "tiktok"
            ? "Link copiado. Cole no TikTok."
            : "Link copiado.",
      );
      trackShare(channel);
      window.setTimeout(() => setCopyFeedback(null), 3500);
    } catch {
      setCopyFeedback("Não foi possível copiar o link.");
    }
  }

  async function handleNativeShare() {
    const url = getShareUrl("native_share");
    if (!url || !navigator.share) {
      return;
    }

    trackShare("native_share");
    try {
      await navigator.share({
        title: vehicleTitle,
        text: shareText,
        url,
      });
    } catch {
      // User dismissed share sheet.
    }
  }

  function openShareWindow(href: string, channel: ShareChannel) {
    trackShare(channel);
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=520");
  }

  function handleWhatsAppShare() {
    const url = getShareUrl("whatsapp");
    if (!url) {
      return;
    }
    openShareWindow(buildWhatsAppShareUrl(`${shareText} ${url}`), "whatsapp");
  }

  function handleFacebookShare() {
    const url = getShareUrl("facebook");
    if (!url) {
      return;
    }
    openShareWindow(buildFacebookShareUrl(url), "facebook");
  }

  const channels: ShareChannelConfig[] = [
    { id: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon className="size-4" /> },
    { id: "facebook", label: "Facebook", icon: <FacebookIcon className="size-4" /> },
    { id: "instagram", label: "Instagram", icon: <InstagramIcon className="size-4" /> },
    { id: "tiktok", label: "TikTok", icon: <TikTokIcon className="size-4" /> },
    { id: "copy_link", label: "Copiar link", icon: <Copy className="size-4" aria-hidden /> },
  ];

  function handleChannelClick(channel: ShareChannelConfig) {
    switch (channel.id) {
      case "whatsapp":
        handleWhatsAppShare();
        break;
      case "facebook":
        handleFacebookShare();
        break;
      case "instagram":
      case "tiktok":
      case "copy_link":
        void copyShareLink(channel.id);
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("border-t border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)] pt-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--storefront-fg,var(--dealer-fg))]/60">
          Compartilhar
        </p>
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="inline-flex items-center gap-1 text-xs text-[var(--storefront-fg,var(--dealer-fg))]/55 transition hover:text-[var(--primary-color,var(--dealer-primary))]"
          >
            <Share2 className="size-3.5" aria-hidden />
            Mais opções
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            title={channel.label}
            aria-label={`Compartilhar no ${channel.label}`}
            onClick={() => handleChannelClick(channel)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_14%,transparent)] bg-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_96%,white)] text-[var(--storefront-fg,var(--dealer-fg))]/70 transition hover:border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_28%,transparent)] hover:text-[var(--primary-color,var(--dealer-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color,var(--dealer-primary))] focus-visible:ring-offset-1"
          >
            {channel.icon}
          </button>
        ))}
      </div>

      {copyFeedback ? (
        <p
          className="mt-2 flex items-start gap-1.5 text-xs text-[var(--storefront-fg,var(--dealer-fg))]/65"
          role="status"
        >
          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
          {copyFeedback}
        </p>
      ) : null}
    </div>
  );
}
