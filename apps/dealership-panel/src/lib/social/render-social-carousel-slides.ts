import "server-only";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import {
  collectDealershipLogoCandidateUrls,
  resolveDealershipLogoForDarkBackground,
} from "@autopainel/shared/lib/theme/branding";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

const SLIDE_SIZE = 1080;
const MAX_VEHICLE_PHOTOS = 7;
const LOGO_BADGE_MAX_WIDTH = 200;
const LOGO_BADGE_MAX_HEIGHT = 72;
const WATERMARK_WIDTH_RATIO = 0.38;
const WATERMARK_OPACITY = 0.14;

type ArtifactTemplate = "classic" | "performance" | "tech";
type SlideKind = "cover" | "gallery";

export interface RenderSocialCarouselInput {
  jobId: string;
  dealershipId: string;
  artifactTemplate: ArtifactTemplate;
  payloadSnapshot: Record<string, unknown>;
  previewOnly?: boolean;
  watermarkEnabled?: boolean;
}

export interface RenderSocialCarouselResult {
  imageUrls: string[];
  slideCount: number;
  includesCtaSlide: boolean;
}

interface TemplateTheme {
  label: string;
  accent: string;
  accentSoft: string;
  ink: string;
  inkSoft: string;
  onAccent: string;
  onInk: string;
  badge: string;
}

interface LoadedLogo {
  pngBuffer: Buffer;
  width: number;
  height: number;
}

interface LogoFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SlideOverlayLayer {
  svg: Buffer;
  logoFrame: LogoFrame | null;
}

function templateTheme(template: ArtifactTemplate): TemplateTheme {
  if (template === "performance") {
    return {
      label: "Performance",
      accent: "#E11D48",
      accentSoft: "#FB7185",
      ink: "#09090B",
      inkSoft: "#18181B",
      onAccent: "#FFFFFF",
      onInk: "#FAFAFA",
      badge: "DISPONÍVEL",
    };
  }
  if (template === "tech") {
    return {
      label: "Tech",
      accent: "#2563EB",
      accentSoft: "#38BDF8",
      ink: "#0F172A",
      inkSoft: "#1E293B",
      onAccent: "#FFFFFF",
      onInk: "#F8FAFC",
      badge: "DESTAQUE",
    };
  }
  return {
    label: "Classic",
    accent: "#C9A962",
    accentSoft: "#E8D5A3",
    ink: "#1C1917",
    inkSoft: "#292524",
    onAccent: "#1C1917",
    onInk: "#FAFAF9",
    badge: "SEMIMOVOS",
  };
}

function readVehicleImages(payload: Record<string, unknown>): string[] {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const images = vehicle?.images;
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .slice(0, MAX_VEHICLE_PHOTOS);
}

function readVehicleTitle(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const brand = typeof vehicle?.brand === "string" ? vehicle.brand : "";
  const model = typeof vehicle?.model === "string" ? vehicle.model : "";
  return `${brand} ${model}`.trim() || "Veículo em destaque";
}

function readVehicleYearLabel(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const modelYear = vehicle?.model_year;
  const manufacturingYear = vehicle?.manufacturing_year;
  if (typeof modelYear === "number" && typeof manufacturingYear === "number") {
    if (modelYear === manufacturingYear) {
      return String(modelYear);
    }
    return `${manufacturingYear}/${modelYear}`;
  }
  if (typeof modelYear === "number") {
    return String(modelYear);
  }
  if (typeof manufacturingYear === "number") {
    return String(manufacturingYear);
  }
  return "";
}

function readStoreName(payload: Record<string, unknown>): string {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  return typeof dealership?.name === "string" ? dealership.name : "AutoPainel";
}

function readStorePhone(payload: Record<string, unknown>): string {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  const phone = dealership?.phone;
  if (typeof phone !== "string" || !phone.trim()) {
    return "";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

function readLogoCandidateUrls(payload: Record<string, unknown>): string[] {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  if (!dealership) {
    return [];
  }

  const columnLogoUrl =
    typeof dealership.logo_url === "string" && dealership.logo_url.length > 0
      ? dealership.logo_url
      : null;

  const candidates = collectDealershipLogoCandidateUrls(
    dealership.theme_config,
    columnLogoUrl,
  );
  const preferred = resolveDealershipLogoForDarkBackground(
    dealership.theme_config,
    columnLogoUrl,
  );

  if (!preferred) {
    return candidates;
  }

  return [preferred, ...candidates.filter((url) => url !== preferred)];
}

function readPriceLabel(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const price = vehicle?.price;
  if (typeof price !== "number") {
    return "";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
}

function readWatermarkEnabled(
  payload: Record<string, unknown>,
  explicit?: boolean,
): boolean {
  if (typeof explicit === "boolean") {
    return explicit;
  }
  return payload.branding_mask !== false;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function storeInitials(storeName: string): string {
  const parts = storeName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "AP";
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function buildLogoBadgeLayout(params: {
  theme: TemplateTheme;
  template: ArtifactTemplate;
  storeName: string;
  hasLogo: boolean;
  x: number;
  y: number;
  compact?: boolean;
}): { svg: string; logoFrame: LogoFrame | null } {
  const compact = params.compact === true;
  const badgeHeight = compact ? 56 : 72;
  const badgeWidth = compact ? 180 : 240;

  if (params.hasLogo) {
    if (params.template === "performance") {
      return {
        logoFrame: { x: params.x, y: params.y, width: badgeWidth, height: badgeHeight },
        svg: `
        <g>
          <polygon points="${params.x},${params.y + 10} ${params.x + badgeWidth},${params.y} ${params.x + badgeWidth},${params.y + badgeHeight} ${params.x},${params.y + badgeHeight}" fill="${params.theme.ink}" opacity="0.94"/>
          <rect x="${params.x + badgeWidth - 8}" y="${params.y}" width="8" height="${badgeHeight}" fill="${params.theme.accent}"/>
        </g>`,
      };
    }

    if (params.template === "tech") {
      return {
        logoFrame: { x: params.x, y: params.y, width: badgeWidth, height: badgeHeight },
        svg: `
        <g>
          <rect x="${params.x}" y="${params.y}" width="${badgeWidth}" height="${badgeHeight}" rx="18" fill="rgba(15,23,42,0.72)" stroke="rgba(56,189,248,0.55)" stroke-width="2"/>
          <rect x="${params.x + 10}" y="${params.y + 10}" width="${badgeWidth - 20}" height="4" rx="2" fill="${params.theme.accentSoft}" opacity="0.9"/>
        </g>`,
      };
    }

    return {
      logoFrame: { x: params.x, y: params.y, width: badgeWidth, height: badgeHeight },
      svg: `
      <g>
        <rect x="${params.x}" y="${params.y}" width="${badgeWidth}" height="${badgeHeight}" rx="14" fill="rgba(28,25,23,0.82)" stroke="${params.theme.accent}" stroke-width="2"/>
      </g>`,
    };
  }

  const initials = escapeXml(storeInitials(params.storeName));
  const label = escapeXml(truncateText(params.storeName, compact ? 14 : 18));
  const fallbackBadgeWidth = compact ? 170 : 220;

  if (params.template === "performance") {
    return {
      logoFrame: null,
      svg: `
      <g>
        <polygon points="${params.x},${params.y + 10} ${params.x + fallbackBadgeWidth},${params.y} ${params.x + fallbackBadgeWidth},${params.y + badgeHeight} ${params.x},${params.y + badgeHeight}" fill="${params.theme.ink}" opacity="0.94"/>
        <rect x="${params.x + fallbackBadgeWidth - 8}" y="${params.y}" width="8" height="${badgeHeight}" fill="${params.theme.accent}"/>
        <text x="${params.x + 24}" y="${params.y + 34}" fill="${params.theme.accentSoft}" font-size="22" font-family="Arial, Helvetica, sans-serif" font-weight="800">${initials}</text>
        <text x="${params.x + 24}" y="${params.y + 58}" fill="${params.theme.onInk}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>
      </g>`,
    };
  }

  if (params.template === "tech") {
    return {
      logoFrame: null,
      svg: `
      <g>
        <rect x="${params.x}" y="${params.y}" width="${fallbackBadgeWidth}" height="${badgeHeight}" rx="18" fill="rgba(15,23,42,0.72)" stroke="rgba(56,189,248,0.55)" stroke-width="2"/>
        <circle cx="${params.x + 34}" cy="${params.y + badgeHeight / 2 + 2}" r="18" fill="${params.theme.accent}"/>
        <text x="${params.x + 34}" y="${params.y + badgeHeight / 2 + 9}" fill="${params.theme.onAccent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${initials}</text>
        <text x="${params.x + 64}" y="${params.y + badgeHeight / 2 + 8}" fill="${params.theme.onInk}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>
      </g>`,
    };
  }

  return {
    logoFrame: null,
    svg: `
    <g>
      <rect x="${params.x}" y="${params.y}" width="${fallbackBadgeWidth}" height="${badgeHeight}" rx="14" fill="rgba(28,25,23,0.82)" stroke="${params.theme.accent}" stroke-width="2"/>
      <circle cx="${params.x + 34}" cy="${params.y + badgeHeight / 2}" r="18" fill="${params.theme.accent}"/>
      <text x="${params.x + 34}" y="${params.y + badgeHeight / 2 + 7}" fill="${params.theme.onAccent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${initials}</text>
      <text x="${params.x + 64}" y="${params.y + badgeHeight / 2 + 7}" fill="${params.theme.onInk}" font-size="18" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${label}</text>
    </g>`,
  };
}

function buildClassicPhotoOverlay(params: {
  theme: TemplateTheme;
  slideKind: SlideKind;
  primaryLine: string;
  secondaryLine: string;
  tertiaryLine: string;
  storeName: string;
  hasLogo: boolean;
  photoIndex?: number;
  photoTotal?: number;
}): { body: string; logoFrame: LogoFrame | null } {
  const primary = escapeXml(truncateText(params.primaryLine, 28));
  const secondary = escapeXml(truncateText(params.secondaryLine, 36));
  const tertiary = escapeXml(truncateText(params.tertiaryLine, 40));
  const counter =
    params.slideKind === "gallery" && params.photoIndex && params.photoTotal
      ? escapeXml(`${params.photoIndex} / ${params.photoTotal}`)
      : "";

  const footerHeight = params.slideKind === "cover" ? 240 : 120;
  const badge = buildLogoBadgeLayout({
    theme: params.theme,
    template: "classic",
    storeName: params.storeName,
    hasLogo: params.hasLogo,
    x: 48,
    y: 48,
    compact: params.slideKind === "gallery",
  });

  return {
    logoFrame: badge.logoFrame,
    body: `
    <defs>
      <linearGradient id="classicTopFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="classicBottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1C1917" stop-opacity="0"/>
        <stop offset="55%" stop-color="#1C1917" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#1C1917" stop-opacity="0.96"/>
      </linearGradient>
    </defs>
    <rect width="${SLIDE_SIZE}" height="220" fill="url(#classicTopFade)"/>
    <rect y="${SLIDE_SIZE - footerHeight - 80}" width="${SLIDE_SIZE}" height="${footerHeight + 80}" fill="url(#classicBottomFade)"/>
    <rect x="48" y="${SLIDE_SIZE - footerHeight + 18}" width="6" height="${footerHeight - 36}" rx="3" fill="${params.theme.accent}"/>
    ${badge.svg}
    ${
      params.slideKind === "cover"
        ? `
    <text x="78" y="${SLIDE_SIZE - footerHeight + 72}" fill="${params.theme.onInk}" font-size="46" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${primary}</text>
    <text x="78" y="${SLIDE_SIZE - footerHeight + 122}" fill="${params.theme.accentSoft}" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">${secondary}</text>
    <text x="78" y="${SLIDE_SIZE - footerHeight + 168}" fill="#D6D3D1" font-size="24" font-family="Arial, Helvetica, sans-serif">${tertiary}</text>
    <rect x="78" y="${SLIDE_SIZE - 58}" width="170" height="34" rx="17" fill="${params.theme.accent}"/>
    <text x="163" y="${SLIDE_SIZE - 35}" fill="${params.theme.onAccent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${escapeXml(params.theme.badge)}</text>`
        : `
    <text x="78" y="${SLIDE_SIZE - 72}" fill="${params.theme.onInk}" font-size="28" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${escapeXml(truncateText(params.storeName, 24))}</text>
    <text x="78" y="${SLIDE_SIZE - 38}" fill="${params.theme.accentSoft}" font-size="20" font-family="Arial, Helvetica, sans-serif">${counter}</text>`
    }`,
  };
}

function buildPerformancePhotoOverlay(params: {
  theme: TemplateTheme;
  slideKind: SlideKind;
  primaryLine: string;
  secondaryLine: string;
  tertiaryLine: string;
  storeName: string;
  hasLogo: boolean;
  photoIndex?: number;
  photoTotal?: number;
}): { body: string; logoFrame: LogoFrame | null } {
  const primary = escapeXml(truncateText(params.primaryLine, 24).toUpperCase());
  const secondary = escapeXml(truncateText(params.secondaryLine, 32).toUpperCase());
  const tertiary = escapeXml(truncateText(params.tertiaryLine, 36).toUpperCase());
  const counter =
    params.slideKind === "gallery" && params.photoIndex && params.photoTotal
      ? escapeXml(`${params.photoIndex}/${params.photoTotal}`)
      : "";

  const badge = buildLogoBadgeLayout({
    theme: params.theme,
    template: "performance",
    storeName: params.storeName,
    hasLogo: params.hasLogo,
    x: 48,
    y: 48,
    compact: params.slideKind === "gallery",
  });

  return {
    logoFrame: badge.logoFrame,
    body: `
    <defs>
      <linearGradient id="perfGlow" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="${params.theme.accent}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${params.theme.inkSoft}" stop-opacity="0.98"/>
      </linearGradient>
    </defs>
    <polygon points="0,0 1080,0 1080,150 0,190" fill="${params.theme.ink}" opacity="0.82"/>
    <polygon points="0,860 1080,820 1080,1080 0,1080" fill="url(#perfGlow)"/>
    <polygon points="0,840 1080,800 1080,860 0,900" fill="${params.theme.ink}" opacity="0.92"/>
    ${badge.svg}
    ${
      params.slideKind === "cover"
        ? `
    <text x="56" y="930" fill="${params.theme.onInk}" font-size="42" font-family="Arial, Helvetica, sans-serif" font-weight="900" letter-spacing="1">${primary}</text>
    <text x="56" y="982" fill="${params.theme.accentSoft}" font-size="30" font-family="Arial, Helvetica, sans-serif" font-weight="800" letter-spacing="0.5">${secondary}</text>
    <text x="56" y="1024" fill="#E4E4E7" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="600">${tertiary}</text>
    <rect x="860" y="892" width="164" height="44" rx="4" fill="${params.theme.accent}"/>
    <text x="942" y="922" fill="${params.theme.onAccent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle">${escapeXml(params.theme.badge)}</text>`
        : `
    <text x="56" y="962" fill="${params.theme.onInk}" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="900">${escapeXml(truncateText(params.storeName, 22).toUpperCase())}</text>
    <text x="56" y="1000" fill="${params.theme.accentSoft}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="800">${counter}</text>`
    }`,
  };
}

function buildTechPhotoOverlay(params: {
  theme: TemplateTheme;
  slideKind: SlideKind;
  primaryLine: string;
  secondaryLine: string;
  tertiaryLine: string;
  storeName: string;
  hasLogo: boolean;
  photoIndex?: number;
  photoTotal?: number;
}): { body: string; logoFrame: LogoFrame | null } {
  const primary = escapeXml(truncateText(params.primaryLine, 28));
  const secondary = escapeXml(truncateText(params.secondaryLine, 34));
  const tertiary = escapeXml(truncateText(params.tertiaryLine, 40));
  const counter =
    params.slideKind === "gallery" && params.photoIndex && params.photoTotal
      ? escapeXml(`Foto ${params.photoIndex} de ${params.photoTotal}`)
      : "";

  const panelY = params.slideKind === "cover" ? 760 : 900;
  const panelHeight = params.slideKind === "cover" ? 250 : 140;
  const badge = buildLogoBadgeLayout({
    theme: params.theme,
    template: "tech",
    storeName: params.storeName,
    hasLogo: params.hasLogo,
    x: 48,
    y: 48,
    compact: params.slideKind === "gallery",
  });

  return {
    logoFrame: badge.logoFrame,
    body: `
    <defs>
      <linearGradient id="techOrb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${params.theme.accentSoft}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${params.theme.accent}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="techPanel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(15,23,42,0.55)"/>
        <stop offset="100%" stop-color="rgba(15,23,42,0.92)"/>
      </linearGradient>
    </defs>
    <circle cx="920" cy="120" r="180" fill="url(#techOrb)"/>
    <circle cx="140" cy="980" r="120" fill="url(#techOrb)"/>
    ${badge.svg}
    <rect x="36" y="${panelY}" width="1008" height="${panelHeight}" rx="28" fill="url(#techPanel)" stroke="rgba(56,189,248,0.35)" stroke-width="2"/>
    <rect x="56" y="${panelY + 18}" width="120" height="6" rx="3" fill="${params.theme.accentSoft}"/>
    ${
      params.slideKind === "cover"
        ? `
    <text x="56" y="${panelY + 72}" fill="${params.theme.onInk}" font-size="44" font-family="Arial, Helvetica, sans-serif" font-weight="800">${primary}</text>
    <text x="56" y="${panelY + 124}" fill="${params.theme.accentSoft}" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700">${secondary}</text>
    <text x="56" y="${panelY + 168}" fill="#CBD5E1" font-size="22" font-family="Arial, Helvetica, sans-serif">${tertiary}</text>
    <rect x="842" y="${panelY + 36}" width="178" height="42" rx="21" fill="${params.theme.accent}"/>
    <text x="931" y="${panelY + 65}" fill="${params.theme.onAccent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${escapeXml(params.theme.badge)}</text>`
        : `
    <text x="56" y="${panelY + 64}" fill="${params.theme.onInk}" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeXml(truncateText(params.storeName, 24))}</text>
    <text x="56" y="${panelY + 104}" fill="${params.theme.accentSoft}" font-size="20" font-family="Arial, Helvetica, sans-serif">${counter}</text>`
    }`,
  };
}

function buildPhotoSlideOverlaySvg(params: {
  template: ArtifactTemplate;
  theme: TemplateTheme;
  slideKind: SlideKind;
  primaryLine: string;
  secondaryLine: string;
  tertiaryLine: string;
  storeName: string;
  hasLogo: boolean;
  photoIndex?: number;
  photoTotal?: number;
}): SlideOverlayLayer {
  const overlay =
    params.template === "performance"
      ? buildPerformancePhotoOverlay(params)
      : params.template === "tech"
        ? buildTechPhotoOverlay(params)
        : buildClassicPhotoOverlay(params);

  const svg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${overlay.body}
</svg>`;

  return {
    svg: Buffer.from(svg),
    logoFrame: overlay.logoFrame,
  };
}

const CTA_LOGO_FRAME: LogoFrame = { x: 400, y: 190, width: 280, height: 120 };

function buildCtaSlideLayer(params: {
  template: ArtifactTemplate;
  theme: TemplateTheme;
  storeName: string;
  phone: string;
  vehicleTitle: string;
  hasLogo: boolean;
}): SlideOverlayLayer {
  const storeName = escapeXml(truncateText(params.storeName, 28));
  const vehicleTitle = escapeXml(truncateText(params.vehicleTitle, 34));
  const phoneLine = escapeXml(params.phone || "Chame no WhatsApp");
  const logoBlock = params.hasLogo
    ? `
          <rect x="${CTA_LOGO_FRAME.x}" y="${CTA_LOGO_FRAME.y}" width="${CTA_LOGO_FRAME.width}" height="${CTA_LOGO_FRAME.height}" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>`
    : `
          <circle cx="540" cy="250" r="72" fill="rgba(255,255,255,0.12)"/>
          <text x="540" y="262" fill="${params.theme.onInk}" font-size="42" font-family="Arial, Helvetica, sans-serif" font-weight="800" text-anchor="middle">${escapeXml(storeInitials(params.storeName))}</text>`;

  if (params.template === "performance") {
    const svg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ctaPerf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090B"/>
      <stop offset="100%" stop-color="#7F1D1D"/>
    </linearGradient>
  </defs>
  <rect width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" fill="url(#ctaPerf)"/>
  <polygon points="0,180 1080,120 1080,260 0,320" fill="${params.theme.accent}" opacity="0.95"/>
  ${logoBlock}
  <text x="540" y="430" fill="${params.theme.onInk}" font-size="48" font-family="Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle">${storeName}</text>
  <text x="540" y="500" fill="#FCA5A5" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${vehicleTitle}</text>
  <rect x="290" y="620" width="500" height="88" rx="8" fill="${params.theme.accent}"/>
  <text x="540" y="676" fill="${params.theme.onAccent}" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle">QUERO SABER MAIS</text>
  <text x="540" y="770" fill="#E4E4E7" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">${phoneLine}</text>
</svg>`;
    return {
      svg: Buffer.from(svg),
      logoFrame: params.hasLogo ? CTA_LOGO_FRAME : null,
    };
  }

  if (params.template === "tech") {
    const svg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ctaTech" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" fill="url(#ctaTech)"/>
  <circle cx="180" cy="160" r="120" fill="#38BDF8" opacity="0.18"/>
  <circle cx="920" cy="900" r="160" fill="#2563EB" opacity="0.22"/>
  ${logoBlock}
  <text x="540" y="430" fill="${params.theme.onInk}" font-size="46" font-family="Arial, Helvetica, sans-serif" font-weight="800" text-anchor="middle">${storeName}</text>
  <text x="540" y="498" fill="#BFDBFE" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">${vehicleTitle}</text>
  <rect x="280" y="610" width="520" height="92" rx="46" fill="${params.theme.accent}"/>
  <text x="540" y="670" fill="${params.theme.onAccent}" font-size="30" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">Agende um test-drive</text>
  <text x="540" y="770" fill="#E2E8F0" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">${phoneLine}</text>
</svg>`;
    return {
      svg: Buffer.from(svg),
      logoFrame: params.hasLogo ? CTA_LOGO_FRAME : null,
    };
  }

  const svg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ctaClassic" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#1C1917"/>
    </linearGradient>
  </defs>
  <rect width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" fill="url(#ctaClassic)"/>
  <rect x="120" y="120" width="840" height="4" fill="${params.theme.accent}"/>
  ${logoBlock}
  <text x="540" y="430" fill="${params.theme.onInk}" font-size="50" font-family="Georgia, 'Times New Roman', serif" font-weight="700" text-anchor="middle">${storeName}</text>
  <text x="540" y="500" fill="${params.theme.accentSoft}" font-size="28" font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">${vehicleTitle}</text>
  <rect x="300" y="620" width="480" height="84" rx="42" fill="${params.theme.accent}"/>
  <text x="540" y="672" fill="${params.theme.onAccent}" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">Saiba mais agora</text>
  <text x="540" y="770" fill="#D6D3D1" font-size="28" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">${phoneLine}</text>
</svg>`;
  return {
    svg: Buffer.from(svg),
    logoFrame: params.hasLogo ? CTA_LOGO_FRAME : null,
  };
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}): ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function loadLogoFromUrl(url: string): Promise<LoadedLogo | null> {
  try {
    const logoBuffer = await downloadImage(url);
    const resized = await sharp(logoBuffer)
      .ensureAlpha()
      .resize(LOGO_BADGE_MAX_WIDTH * 3, LOGO_BADGE_MAX_HEIGHT * 3, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    const meta = await sharp(resized).metadata();
    return {
      pngBuffer: resized,
      width: meta.width ?? LOGO_BADGE_MAX_WIDTH,
      height: meta.height ?? LOGO_BADGE_MAX_HEIGHT,
    };
  } catch {
    return null;
  }
}

async function loadLogoFromCandidates(urls: string[]): Promise<LoadedLogo | null> {
  for (const url of urls) {
    const logo = await loadLogoFromUrl(url);
    if (logo) {
      return logo;
    }
  }
  return null;
}

async function createLogoOverlay(
  logo: LoadedLogo,
  frame: LogoFrame,
): Promise<sharp.OverlayOptions> {
  const paddingX = 16;
  const paddingY = 10;
  const maxWidth = Math.max(1, frame.width - paddingX * 2);
  const maxHeight = Math.max(1, frame.height - paddingY * 2);
  const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height, 1);
  const width = Math.max(1, Math.round(logo.width * scale));
  const height = Math.max(1, Math.round(logo.height * scale));
  const resized = await sharp(logo.pngBuffer)
    .resize(width, height, { fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const actualWidth = meta.width ?? width;
  const actualHeight = meta.height ?? height;

  return {
    input: resized,
    left: frame.x + Math.round((frame.width - actualWidth) / 2),
    top: frame.y + Math.round((frame.height - actualHeight) / 2),
  };
}

async function buildWatermarkOverlay(logo: LoadedLogo): Promise<sharp.OverlayOptions> {
  const watermarkWidth = Math.round(SLIDE_SIZE * WATERMARK_WIDTH_RATIO);
  const resized = await sharp(logo.pngBuffer)
    .resize(watermarkWidth, watermarkWidth, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i]! * WATERMARK_OPACITY);
  }

  return {
    input: Buffer.from(data),
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
    left: Math.round((SLIDE_SIZE - info.width) / 2),
    top: Math.round((SLIDE_SIZE - info.height) / 2),
  };
}

async function compositeSlideLayers(
  base: Buffer,
  layers: sharp.OverlayOptions[],
): Promise<Buffer> {
  if (layers.length === 0) {
    return base;
  }
  return sharp(base).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

async function renderLayeredSlide(params: {
  base: Buffer;
  overlay: SlideOverlayLayer;
  logo: LoadedLogo | null;
  watermarkEnabled: boolean;
}): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = [];

  if (params.watermarkEnabled && params.logo) {
    composites.push(await buildWatermarkOverlay(params.logo));
  }

  composites.push({ input: params.overlay.svg, top: 0, left: 0 });

  if (params.logo && params.overlay.logoFrame) {
    composites.push(await createLogoOverlay(params.logo, params.overlay.logoFrame));
  }

  return compositeSlideLayers(params.base, composites);
}

async function renderPhotoSlide(params: {
  template: ArtifactTemplate;
  theme: TemplateTheme;
  slideKind: SlideKind;
  sourceUrl: string;
  primaryLine: string;
  secondaryLine: string;
  tertiaryLine: string;
  storeName: string;
  logo: LoadedLogo | null;
  watermarkEnabled: boolean;
  photoIndex?: number;
  photoTotal?: number;
}): Promise<Buffer> {
  const source = await downloadImage(params.sourceUrl);
  const base = await sharp(source)
    .resize(SLIDE_SIZE, SLIDE_SIZE, { fit: "cover", position: "centre" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  const overlay = buildPhotoSlideOverlaySvg({
    template: params.template,
    theme: params.theme,
    slideKind: params.slideKind,
    primaryLine: params.primaryLine,
    secondaryLine: params.secondaryLine,
    tertiaryLine: params.tertiaryLine,
    storeName: params.storeName,
    hasLogo: params.logo !== null,
    photoIndex: params.photoIndex,
    photoTotal: params.photoTotal,
  });

  return renderLayeredSlide({
    base,
    overlay,
    logo: params.logo,
    watermarkEnabled: params.watermarkEnabled,
  });
}

async function renderCtaSlide(params: {
  template: ArtifactTemplate;
  theme: TemplateTheme;
  storeName: string;
  phone: string;
  vehicleTitle: string;
  logo: LoadedLogo | null;
}): Promise<Buffer> {
  const overlay = buildCtaSlideLayer({
    template: params.template,
    theme: params.theme,
    storeName: params.storeName,
    phone: params.phone,
    vehicleTitle: params.vehicleTitle,
    hasLogo: params.logo !== null,
  });

  const base = await sharp(overlay.svg).png().toBuffer();
  return renderLayeredSlide({
    base,
    overlay,
    logo: params.logo,
    watermarkEnabled: false,
  });
}

function publicObjectUrl(supabaseUrl: string, storagePath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/social-carousel-artifacts/${storagePath}`;
}

export async function renderSocialCarouselSlides(
  input: RenderSocialCarouselInput,
): Promise<RenderSocialCarouselResult> {
  const imageUrls = readVehicleImages(input.payloadSnapshot);
  if (imageUrls.length === 0) {
    throw new Error("Snapshot do veículo sem imagens para renderizar.");
  }

  const theme = templateTheme(input.artifactTemplate);
  const storeName = readStoreName(input.payloadSnapshot);
  const vehicleTitle = readVehicleTitle(input.payloadSnapshot);
  const yearLabel = readVehicleYearLabel(input.payloadSnapshot);
  const priceLabel = readPriceLabel(input.payloadSnapshot);
  const phone = readStorePhone(input.payloadSnapshot);
  const watermarkEnabled = readWatermarkEnabled(
    input.payloadSnapshot,
    input.watermarkEnabled,
  );
  const logo = await loadLogoFromCandidates(readLogoCandidateUrls(input.payloadSnapshot));

  const supabase = createSupabaseServiceRoleClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for carousel upload.");
  }

  const storagePrefix = input.previewOnly
    ? `preview/${input.dealershipId}/${randomUUID()}`
    : `${input.dealershipId}/${input.jobId}`;

  const renderedUrls: string[] = [];
  let slideIndex = 0;
  const photoTotal = imageUrls.length;

  const coverJpeg = await renderPhotoSlide({
    template: input.artifactTemplate,
    theme,
    slideKind: "cover",
    sourceUrl: imageUrls[0],
    primaryLine: vehicleTitle,
    secondaryLine: priceLabel,
    tertiaryLine: [yearLabel, storeName].filter(Boolean).join(" · "),
    storeName,
    logo,
    watermarkEnabled,
  });
  const coverPath = `${storagePrefix}/${slideIndex}.jpg`;
  const coverUpload = await supabase.storage
    .from("social-carousel-artifacts")
    .upload(coverPath, coverJpeg, { contentType: "image/jpeg", upsert: true });
  if (coverUpload.error) {
    throw new Error(`Upload do slide capa falhou: ${coverUpload.error.message}`);
  }
  renderedUrls.push(publicObjectUrl(supabaseUrl, coverPath));
  slideIndex += 1;

  for (let photoIndex = 1; photoIndex < imageUrls.length; photoIndex += 1) {
    const jpeg = await renderPhotoSlide({
      template: input.artifactTemplate,
      theme,
      slideKind: "gallery",
      sourceUrl: imageUrls[photoIndex],
      primaryLine: storeName,
      secondaryLine: vehicleTitle,
      tertiaryLine: priceLabel,
      storeName,
      logo,
      watermarkEnabled,
      photoIndex: photoIndex + 1,
      photoTotal,
    });
    const storagePath = `${storagePrefix}/${slideIndex}.jpg`;
    const { error } = await supabase.storage
      .from("social-carousel-artifacts")
      .upload(storagePath, jpeg, { contentType: "image/jpeg", upsert: true });
    if (error) {
      throw new Error(`Upload do slide ${slideIndex + 1} falhou: ${error.message}`);
    }
    renderedUrls.push(publicObjectUrl(supabaseUrl, storagePath));
    slideIndex += 1;
  }

  const ctaJpeg = await renderCtaSlide({
    template: input.artifactTemplate,
    theme,
    storeName,
    phone,
    vehicleTitle,
    logo,
  });
  const ctaPath = `${storagePrefix}/${slideIndex}.jpg`;
  const ctaUpload = await supabase.storage
    .from("social-carousel-artifacts")
    .upload(ctaPath, ctaJpeg, { contentType: "image/jpeg", upsert: true });
  if (ctaUpload.error) {
    throw new Error(`Upload do slide CTA falhou: ${ctaUpload.error.message}`);
  }
  renderedUrls.push(publicObjectUrl(supabaseUrl, ctaPath));

  return {
    imageUrls: renderedUrls,
    slideCount: renderedUrls.length,
    includesCtaSlide: true,
  };
}
