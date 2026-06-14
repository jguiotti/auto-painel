import Link from "next/link";

import {
  isAnyClassifiedsModuleEnabled,
  isDealershipFeatureEnabled,
} from "@autopainel/shared/lib/dealership-features";
import {
  resolveDealershipStorefrontPublicUrl,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";
import {
  Button,
  PageContainer,
  Separator,
} from "@autopainel/shared/ui";

import { signOutAction } from "@/app/painel/actions";

import { DealershipBrandImage } from "@/components/branding/dealership-brand-image";
import { DealershipSidebarNav } from "@/components/dashboard/dealership-sidebar-nav";
import { DashboardMobileNavMount } from "@/components/dashboard/dashboard-mobile-nav-mount";
import {
  DealershipNotificationProvider,
  DealershipNotificationTrigger,
} from "@/components/dashboard/dealership-notification-provider";

interface DashboardShellProps {
  dealershipName: string;
  dealershipSlug: string;
  dealershipLogoUrl: string | null;
  dealershipLogoCandidateUrls?: string[];
  dealershipId: string;
  activeFeatureKeys: string[];
  /** `profiles.role` for the signed-in user (owner | manager | seller | super_admin). */
  viewerRole: string;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  description: string;
}

function resolveStorefrontUrl(slug: string): string {
  return resolveDealershipStorefrontPublicUrl(slug);
}

export function DashboardShell({
  dealershipName,
  dealershipSlug,
  dealershipLogoUrl,
  dealershipLogoCandidateUrls = [],
  dealershipId,
  activeFeatureKeys,
  viewerRole,
  children,
}: DashboardShellProps) {
  const storefrontUrl = resolveStorefrontUrl(dealershipSlug);
  const showIntegrations =
    isAnyClassifiedsModuleEnabled(activeFeatureKeys) ||
    isDealershipFeatureEnabled(activeFeatureKeys, "social_media_kit");
  const alertOnVitrineLeads =
    viewerRole === "owner" || viewerRole === "super_admin";

  const canManageStoreSettings =
    viewerRole === "owner" ||
    viewerRole === "manager" ||
    viewerRole === "super_admin";

  const primaryNav: NavItem[] = [
    {
      href: "/painel",
      label: "Visão geral",
      description: "Resumo da loja",
    },
    {
      href: "/painel/estoque",
      label: "Estoque",
      description: "Veículos cadastrados",
    },
    {
      href: "/painel/contatos",
      label: "Contatos",
      description: "Leads e simulações",
    },
    ...(canManageStoreSettings
      ? [
          {
            href: "/painel/loja",
            label: "Dados da loja",
            description: "Contato e endereço na vitrine",
          } satisfies NavItem,
          {
            href: "/painel/equipe",
            label: "Equipe",
            description: "Colaboradores e comissões",
          } satisfies NavItem,
        ]
      : []),
  ];

  const optionalNav: NavItem[] = showIntegrations
    ? [
        {
          href: "/painel/integracoes",
          label: "Integrações",
          description: "Redes sociais e classificados",
        },
      ]
    : [];

  return (
    <DealershipNotificationProvider
      dealershipId={dealershipId}
      enabled={alertOnVitrineLeads}
    >
      <div className="min-h-screen bg-muted/30" data-dashboard-shell>
        <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
          <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
            <Link href="/painel" className="flex min-w-0 items-center">
              {dealershipLogoUrl || dealershipLogoCandidateUrls.length > 0 ? (
                <DealershipBrandImage
                  src={dealershipLogoUrl}
                  candidateUrls={dealershipLogoCandidateUrls}
                  alt={dealershipName}
                  className="h-9 w-auto max-w-[9.5rem] object-contain"
                  fallback={
                    <span className="truncate text-sm font-semibold text-foreground">
                      {dealershipName}
                    </span>
                  }
                />
              ) : (
                <span className="truncate text-sm font-semibold text-foreground">
                  {dealershipName}
                </span>
              )}
            </Link>
          </div>

          <DealershipSidebarNav primaryNav={primaryNav} optionalNav={optionalNav} />

          <div className="shrink-0 space-y-2 border-t border-border p-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/painel/conta/perfil">Meu perfil</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/painel/conta/senha">Alterar senha</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                Ver vitrine pública
              </a>
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col lg:pl-64">
          <header className="no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <PageContainer
              size="xl"
              className="flex h-16 items-center justify-between gap-3 sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-2 lg:hidden">
                <DashboardMobileNavMount
                  primaryNav={primaryNav}
                  optionalNav={optionalNav}
                  storefrontUrl={storefrontUrl}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {dealershipName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Painel da loja</p>
                </div>
              </div>

              <div className="hidden min-w-0 lg:block">
                <p className="text-xs text-muted-foreground">Painel da loja</p>
                <p className="truncate text-sm font-semibold text-foreground">{dealershipName}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <DealershipNotificationTrigger />
                <Button variant="outline" size="sm" className="hidden sm:inline-flex lg:hidden" asChild>
                  <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                    Vitrine
                  </a>
                </Button>
                <Separator orientation="vertical" className="hidden h-6 sm:block" />
                <form action={signOutAction} className="inline">
                  <Button type="submit" variant="outline" size="sm">
                    Sair
                  </Button>
                </form>
              </div>
            </PageContainer>
          </header>

          <main className="min-w-0 flex-1">
            <PageContainer size="xl" className="py-8 sm:py-10 print:p-0">
              {children}
            </PageContainer>
          </main>
        </div>
      </div>
    </DealershipNotificationProvider>
  );
}
