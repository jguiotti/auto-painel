import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { fetchDealershipInventoryAgingMetricsAction } from "@/app/painel/growth-actions";
import { formatBrl } from "@/lib/format/format-brl";

const SUGGESTION_LABELS: Record<string, string> = {
  review_price: "Revisar preço",
  add_photos: "Adicionar fotos",
  highlight: "Destacar na vitrine",
};

export async function InventoryAgingSection() {
  const metrics = await fetchDealershipInventoryAgingMetricsAction();

  if ("moduleInactive" in metrics && metrics.moduleInactive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de estoque parado</CardTitle>
          <CardDescription>
            Disponível no plano com módulo de métricas avançadas. Solicite upgrade pelo botão de
            suporte no canto da tela.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if ("error" in metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estoque parado e capital imobilizado</CardTitle>
        <CardDescription>
          Veículos disponíveis há mais tempo geram custo estimado de permanência (referência
          educativa, não contábil).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Capital imobilizado</p>
            <p className="text-lg font-semibold">{formatBrl(metrics.summary.capitalImmobilized)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Média de dias no estoque</p>
            <p className="text-lg font-semibold">{metrics.summary.averageDaysInStock} dias</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Custo diário estimado</p>
            <p className="text-lg font-semibold">
              {formatBrl(metrics.summary.estimatedDailyCarryingCost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Estoque envelhecido (&gt;{metrics.summary.agedThresholdDays} dias)
            </p>
            <p className="text-lg font-semibold">{metrics.summary.agedStockPercent}%</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Precisa de atenção</h3>
          {metrics.attentionVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum veículo acima do limite de atenção no momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Leads (30d)</TableHead>
                  <TableHead>Custo est.</TableHead>
                  <TableHead>Sugestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.attentionVehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicleId}>
                    <TableCell>
                      <Link
                        href={`/painel/estoque/${vehicle.vehicleId}`}
                        className="font-medium hover:underline"
                      >
                        {vehicle.brand} {vehicle.model}
                      </Link>
                    </TableCell>
                    <TableCell>{vehicle.daysInStock}</TableCell>
                    <TableCell>{vehicle.leadsLast30Days}</TableCell>
                    <TableCell>{formatBrl(vehicle.estimatedCarryingCost)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {SUGGESTION_LABELS[vehicle.suggestionKey] ?? "Revisar estratégia"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
