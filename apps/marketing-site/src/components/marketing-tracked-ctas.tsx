"use client";

import { ArrowRight } from "lucide-react";

import { AnalyticsTrackedLink } from "@autopainel/shared/components/analytics/analytics-tracked-link";
import { Button } from "@autopainel/shared/ui";

export function MarketingHomeHeroCtas() {
  return (
    <div className="mt-10 flex flex-wrap gap-4">
      <Button
        size="lg"
        className="bg-marketing-accent text-zinc-950 shadow-lg shadow-cyan-500/20 hover:bg-marketing-accent/90"
        asChild
      >
        <AnalyticsTrackedLink
          href="/contato"
          apEvent="cta_click"
          apEventCategory="conversion"
          apEventLabel="hero_demo"
        >
          Agendar demonstração gratuita
          <ArrowRight className="size-4" aria-hidden />
        </AnalyticsTrackedLink>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10"
        asChild
      >
        <AnalyticsTrackedLink
          href="/planos"
          apEvent="cta_click"
          apEventCategory="engagement"
          apEventLabel="hero_planos"
        >
          Ver planos e módulos
        </AnalyticsTrackedLink>
      </Button>
    </div>
  );
}

export function MarketingHomeBottomCtas() {
  return (
    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
        asChild
      >
        <AnalyticsTrackedLink
          href="/contato"
          apEvent="cta_click"
          apEventCategory="conversion"
          apEventLabel="bottom_demo"
        >
          Quero uma demonstração
        </AnalyticsTrackedLink>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
        asChild
      >
        <AnalyticsTrackedLink
          href="/funcionalidades"
          apEvent="cta_click"
          apEventCategory="engagement"
          apEventLabel="bottom_funcionalidades"
        >
          Explorar funcionalidades
        </AnalyticsTrackedLink>
      </Button>
    </div>
  );
}

export function MarketingHeaderDemoCta() {
  return (
    <Button
      size="sm"
      className="bg-marketing-accent px-3 text-zinc-950 hover:bg-marketing-accent/90 sm:px-4"
      asChild
    >
      <AnalyticsTrackedLink
        href="/contato"
        apEvent="cta_click"
        apEventCategory="conversion"
        apEventLabel="header_demo"
      >
        <span className="sm:hidden">Demo</span>
        <span className="hidden sm:inline">Agendar demonstração</span>
      </AnalyticsTrackedLink>
    </Button>
  );
}
