import { ExternalLink } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@autopainel/shared/ui";

import { resolveDealershipDevSurfaceUrls } from "@/lib/dev/dealership-dev-surface-urls";

interface DealershipDevPreviewLinksProps {
  slug: string;
}

/**
 * Shown only in `NODE_ENV === "development"`: quick links to panel + storefront using
 * `{slug}.{NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}` and dev ports (see `.env.example`).
 */
export function DealershipDevPreviewLinks({ slug }: DealershipDevPreviewLinksProps) {
  const urls = resolveDealershipDevSurfaceUrls(slug);
  if (!urls) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Pré-visualização (desenvolvimento)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ligações com o subdomínio da loja e portas locais do monorepo. Use apenas em dev
          (`{slug}.localhost`).
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={urls.panelUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" aria-hidden />
            Painel da concessionária
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={urls.storefrontUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" aria-hidden />
            Site (vitrine)
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
