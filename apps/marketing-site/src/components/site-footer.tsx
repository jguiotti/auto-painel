import Link from "next/link";

import { BRAND_SLOGAN, LOGO_DESTAQUES_SRC } from "@/lib/brand";
import { PRIVACY_EMAIL } from "@/lib/legal/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="max-w-xs">
            <img
              src={LOGO_DESTAQUES_SRC}
              alt="AutoPainel"
              className="h-auto w-full max-w-[200px] object-contain"
              width={200}
              height={120}
            />
            <p className="font-slogan mt-4 text-sm text-zinc-500">{BRAND_SLOGAN}</p>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-white">Produto</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <Link className="hover:text-white" href="/funcionalidades">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/planos">
                  Planos e módulos
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/contato">
                  Demonstração
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <Link className="hover:text-white" href="/politica-de-privacidade">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/termos-de-uso">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/exclusao-de-dados">
                  Exclusão de dados
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/politica-de-cookies">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <a className="hover:text-white" href={`mailto:${PRIVACY_EMAIL}`}>
                  {PRIVACY_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-zinc-500 md:text-left">
          © {new Date().getFullYear()} AutoPainel. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
