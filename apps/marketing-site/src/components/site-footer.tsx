import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";

import { BRAND_SLOGAN, BRAND_SOCIAL_LINKS, LOGO_DESTAQUES_SRC } from "@/lib/brand";
import { PRIVACY_EMAIL } from "@/lib/legal/constants";

import { FooterBackToTop } from "./footer-back-to-top";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 xl:gap-14">
          <div className="space-y-4">
            <img
              src={LOGO_DESTAQUES_SRC}
              alt="AutoPainel"
              className="h-auto w-full max-w-[200px] object-contain"
              width={200}
              height={120}
            />
            <p className="font-slogan max-w-xs text-sm leading-relaxed text-zinc-500">
              {BRAND_SLOGAN}
            </p>
          </div>

          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-white">Produto</p>
            <ul className="mt-5 space-y-3 text-sm text-zinc-400">
              <li>
                <Link className="transition hover:text-white" href="/funcionalidades">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/planos">
                  Planos e módulos
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/contato">
                  Demonstração
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-white">Legal</p>
            <ul className="mt-5 space-y-3 text-sm text-zinc-400">
              <li>
                <Link className="transition hover:text-white" href="/politica-de-privacidade">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/termos-de-uso">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/exclusao-de-dados">
                  Exclusão de dados
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/politica-de-cookies">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <a className="transition hover:text-white" href={`mailto:${PRIVACY_EMAIL}`}>
                  {PRIVACY_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-white">
              Redes sociais
            </p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-500">
              Siga a AutoPainel e acompanhe novidades da plataforma.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={BRAND_SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white"
                aria-label="AutoPainel no Facebook"
              >
                <Facebook className="h-[18px] w-[18px]" aria-hidden />
              </a>
              <a
                href={BRAND_SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white"
                aria-label="AutoPainel no Instagram"
              >
                <Instagram className="h-[18px] w-[18px]" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 border-t border-white/10 pt-10">
          <FooterBackToTop />
          <p className="text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} AutoPainel. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
