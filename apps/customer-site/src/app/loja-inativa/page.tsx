import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import { resolveDealershipFaviconUrl } from "@autopainel/shared/lib/theme/branding";

import {
  COOKIE_DEALERSHIP_ID,
  HEADER_DEALERSHIP_ID,
  HEADER_DEALERSHIP_STATUS,
} from "@/lib/tenant/constants";

export const dynamic = "force-dynamic";

const SUPPORT_WHATSAPP_URL =
  "https://wa.me/5513997435851?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20minha%20loja%20no%20AutoPainel.";

interface StorefrontShellRow {
  id: string;
  name: string;
  logo_url: string | null;
  theme_config: Record<string, unknown> | null;
  status: string;
}

async function readDealershipId(): Promise<string | null> {
  const headerList = await headers();
  const fromHeader = headerList.get(HEADER_DEALERSHIP_ID);
  if (fromHeader) {
    return fromHeader;
  }
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_DEALERSHIP_ID)?.value ?? null;
}

async function loadShell(dealershipId: string): Promise<StorefrontShellRow | null> {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc("get_dealership_storefront_shell_by_id", {
    p_id: dealershipId,
  });
  if (error) {
    return null;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id || !row?.name) {
    return null;
  }
  return row as StorefrontShellRow;
}

export async function generateMetadata(): Promise<Metadata> {
  const dealershipId = await readDealershipId();
  if (!dealershipId) {
    return { title: "Loja temporariamente indisponível" };
  }
  const shell = await loadShell(dealershipId);
  const faviconUrl = shell
    ? resolveDealershipFaviconUrl(shell.theme_config, shell.logo_url)
    : null;
  return {
    title: shell?.name ? `${shell.name} — indisponível` : "Loja temporariamente indisponível",
    robots: { index: false, follow: false },
    icons: faviconUrl ? { icon: faviconUrl, shortcut: faviconUrl } : undefined,
  };
}

function statusMessage(status: string | null): string {
  if (status === "pending_setup") {
    return "Estamos finalizando a configuração da sua vitrine. Em breve ela estará no ar.";
  }
  return "A vitrine está pausada até a regularização do plano AutoPainel. Assim que o pagamento for confirmado, o site volta automaticamente.";
}

export default async function LojaInativaPage() {
  const headerList = await headers();
  const dealershipId = await readDealershipId();
  const status = headerList.get(HEADER_DEALERSHIP_STATUS);
  const shell = dealershipId ? await loadShell(dealershipId) : null;
  const faviconUrl = shell
    ? resolveDealershipFaviconUrl(shell.theme_config, shell.logo_url)
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      {faviconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl}
          alt=""
          className="mb-6 h-12 w-12 rounded-lg object-contain"
          width={48}
          height={48}
        />
      ) : null}
      <Card className="w-full max-w-lg border-white/10 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-xl text-white">
            {shell?.name ? `${shell.name}` : "Loja temporariamente indisponível"}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {statusMessage(status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p>
            Se você é gestor da loja, acesse o painel após regularizar a assinatura ou fale com o
            suporte AutoPainel.
          </p>
          <p>
            <a
              href={SUPPORT_WHATSAPP_URL}
              className="font-medium text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com o suporte no WhatsApp
            </a>
          </p>
          <p className="text-xs text-zinc-500">
            Powered by AutoPainel — plataforma para concessionárias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
