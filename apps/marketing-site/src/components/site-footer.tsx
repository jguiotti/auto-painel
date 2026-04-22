import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-semibold">AutoPainel</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Plataforma multitenant para gestão de estoque, leads e presença digital
              da sua concessionária — com segurança e isolamento por loja.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <p className="text-sm font-semibold">Produto</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-foreground" href="/funcionalidades">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" href="/contato">
                    Demonstração
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground md:text-left">
          © {new Date().getFullYear()} AutoPainel. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
