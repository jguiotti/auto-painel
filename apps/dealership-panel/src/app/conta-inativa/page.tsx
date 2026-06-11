import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

export default function ContaInativaPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conta inativa</CardTitle>
          <CardDescription>
            Esta concessionária está suspensa, em configuração ou encerrada. O painel e
            a vitrine pública ficam indisponíveis até a operação AutoPainel reativar o
            serviço.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Se acredita que isso é um erro, entre em contato com o suporte AutoPainel com o nome da
            loja ou o subdomínio utilizado.
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
