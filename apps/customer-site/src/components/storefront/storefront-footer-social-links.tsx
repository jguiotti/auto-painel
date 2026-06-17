import { parseDealershipSocialLinks } from "@autopainel/shared/lib/dealership/parse-dealership-social-links";
import { Globe } from "lucide-react";

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Site",
} as const;

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden fill="currentColor">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11.5 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden fill="currentColor">
      <path d="M13.5 22v-8.5h2.8l.4-3.2H13.5V8.9c0-.9.3-1.6 1.7-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.5v3.2h2.7V22h3.3z" />
    </svg>
  );
}

interface StorefrontFooterSocialLinksProps {
  contentConfig: unknown;
}

export function StorefrontFooterSocialLinks({
  contentConfig,
}: StorefrontFooterSocialLinksProps) {
  const links = parseDealershipSocialLinks(
    contentConfig as Record<string, unknown> | null | undefined,
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-3"
      aria-label="Redes sociais"
    >
      {links.map((link) => (
        <a
          key={link.network}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LABELS[link.network]}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] text-[var(--dealer-fg)]/70 transition-colors hover:border-[var(--dealer-accent)] hover:text-[var(--dealer-accent)]"
        >
          {link.network === "instagram" ? <InstagramIcon /> : null}
          {link.network === "facebook" ? <FacebookIcon /> : null}
          {link.network === "website" ? (
            <Globe className="size-[18px]" aria-hidden />
          ) : null}
        </a>
      ))}
    </nav>
  );
}
