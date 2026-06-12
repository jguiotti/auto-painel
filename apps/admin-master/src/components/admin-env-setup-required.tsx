import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

interface AdminEnvSetupRequiredProps {
  message: string;
}

export function AdminEnvSetupRequired({ message }: AdminEnvSetupRequiredProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Configuração do ambiente pendente</CardTitle>
          <CardDescription>
            O build passou, mas o servidor não consegue ligar ao Supabase em produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-foreground">
            {message}
          </p>
          <p>
            Mínimo para o admin-master (Production + Preview):
          </p>
          <ul className="list-inside list-disc space-y-1 font-mono text-xs">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
            <li>NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN</li>
          </ul>
          <p>
            Guia:{" "}
            <code className="rounded bg-muted px-1 text-xs">
              packages/shared/docs/VERCEL_DEPLOY.md
            </code>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
