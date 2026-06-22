"use client";

import { useMemo, useState, type ReactNode } from "react";

interface DealershipBrandImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  candidateUrls?: string[];
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

function dedupeUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const value = raw?.trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
  }
  return out;
}

function DealershipBrandImageInner({
  candidates,
  alt,
  className,
  fallback = null,
}: {
  candidates: string[];
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const currentSrc = index >= 0 ? (candidates[index] ?? null) : null;

  function handleError() {
    setIndex((current) => {
      const next = current + 1;
      return next < candidates.length ? next : -1;
    });
  }

  if (index < 0 || !currentSrc) {
    return fallback;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dealership-configured external URL
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}

export function DealershipBrandImage({
  src,
  fallbackSrc,
  candidateUrls,
  alt,
  className,
  fallback = null,
}: DealershipBrandImageProps) {
  const candidates = useMemo(
    () => dedupeUrls([...(candidateUrls ?? []), src, fallbackSrc]),
    [candidateUrls, src, fallbackSrc],
  );

  return (
    <DealershipBrandImageInner
      key={candidates.join("|")}
      candidates={candidates}
      alt={alt}
      className={className}
      fallback={fallback}
    />
  );
}
