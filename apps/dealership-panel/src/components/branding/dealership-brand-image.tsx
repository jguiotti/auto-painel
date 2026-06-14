"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [candidates]);

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
