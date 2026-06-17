"use client";

import { ChevronUp } from "lucide-react";

export function FooterBackToTop() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
