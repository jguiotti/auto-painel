"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@autopainel/shared/ui";

import {
  type SaveMetaOauthAppState,
  saveDealershipMetaOauthAppAction,
} from "@/app/painel/integracoes/actions";

export interface MetaDeveloperAppFormProps {
  initialMetaAppId: string;
  initialGraphOverride: string;
}

export function MetaDeveloperAppForm({
  initialMetaAppId,
  initialGraphOverride,
}: MetaDeveloperAppFormProps) {
  const router = useRouter();
  const [state, action, isPending] = useActionState<
    SaveMetaOauthAppState | undefined,
    FormData
  >(saveDealershipMetaOauthAppAction, undefined);

  useEffect(() => {
    if (state?.ok === true) {
      router.refresh();
    }
  }, [router, state?.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Meta da concessionária</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use a aplicação criada na sua conta de desenvolvedor Meta (developers.facebook.com).
          O fluxo de autorização inicia-se aqui no painel; a AutoPainel não utiliza uma app Meta
          central para substituir a sua app em produção.
        </p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_app_id">App ID</Label>
            <Input
              id="meta_app_id"
              name="meta_app_id"
              autoComplete="off"
              placeholder="ex.: 1234567890123456"
              defaultValue={initialMetaAppId}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_app_secret">App Secret</Label>
            <Input
              id="meta_app_secret"
              name="meta_app_secret"
              type="password"
              autoComplete="new-password"
              placeholder={
                initialMetaAppId
                  ? "Deixe em branco para manter o segredo atual"
                  : "obrigatório na primeira vez"
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="graph_api_version_override">
              Versão da Graph API (opcional)
            </Label>
            <Input
              id="graph_api_version_override"
              name="graph_api_version_override"
              autoComplete="off"
              placeholder="ex.: 21.0"
              defaultValue={initialGraphOverride}
            />
          </div>

          {state?.ok === false ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <p className="text-sm text-muted-foreground">
              Credenciais da aplicação guardadas.
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "A guardar…" : "Guardar credenciais da app"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
