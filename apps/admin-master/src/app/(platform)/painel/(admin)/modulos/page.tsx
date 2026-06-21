import Link from "next/link";
import { Puzzle } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { Badge, Button } from "@autopainel/shared/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import {
  fetchSaasModulesForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function ModulosPlataformaPage() {
  const schema = await getPricingCatalogSchemaState();
  const modules = await fetchSaasModulesForAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 pt-6">
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/dashboard"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Painel
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Catálogo de módulos
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro mestre das funcionalidades da plataforma. Inclua cada módulo
            nos planos comerciais — não marque módulos diretamente na concessionária.
          </p>
        </div>
        {schema.kind === "ok" ? (
          <Button asChild>
            <Link href="/painel/modulos/nova">Novo módulo</Link>
          </Button>
        ) : (
          <Button type="button" disabled>
            Novo módulo
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos disponíveis</CardTitle>
          <CardDescription>
            Nome e descrição visíveis ao operador; a chave técnica não muda após a criação.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {modules.length === 0 ? (
            <EmptyState
              icon={Puzzle}
              title={
                schema.kind !== "ok"
                  ? "Módulos indisponíveis"
                  : "Catálogo de módulos vazio"
              }
              description={
                schema.kind !== "ok"
                  ? "Corrija a configuração da base acima para carregar os módulos."
                  : "Cadastre funcionalidades da plataforma e inclua-as nos planos comerciais."
              }
              action={
                schema.kind === "ok"
                  ? { label: "Novo módulo", href: "/painel/modulos/nova" }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-mono text-xs">{mod.key}</TableCell>
                    <TableCell>
                      <div className="font-medium">{mod.display_name}</div>
                      {mod.description ? (
                        <div className="text-xs text-muted-foreground">
                          {mod.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{mod.sort_order}</TableCell>
                    <TableCell>
                      {mod.is_active ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/painel/modulos/${mod.id}/editar`}>
                          Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
