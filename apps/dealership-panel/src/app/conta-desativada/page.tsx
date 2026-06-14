import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

export default function ContaDesativadaPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acesso desativado</CardTitle>
          <CardDescription>
            Sua conta de colaborador foi desativada pelo gestor da loja. Você não
            pode acessar o painel até que o acesso seja reativado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Se acredita que isso é um erro, fale com quem administra a concessionária
            ou com o suporte AutoPainel.
          </p>
          <p>
            <Link href="/login" className="font-medium text-primary underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
