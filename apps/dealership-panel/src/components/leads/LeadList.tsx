import Link from "next/link";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { formatDatePt } from "@/lib/format/format-date-pt";
import {
  buildLeadWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/phone/build-whatsapp-url";

export interface LeadListItem {
  id: string;
  client_name: string;
  phone: string;
  type: string;
  created_at: string;
  vehicles: {
    id: string;
    brand: string;
    model: string;
    public_slug: string;
  } | null;
}

interface LeadListProps {
  leads: LeadListItem[];
}

const typeLabel: Record<string, string> = {
  contact: "Contato",
  simulation: "Simulação",
};

export function LeadList({ leads }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        Ainda não há contatos recebidos pela vitrine.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead className="text-right">WhatsApp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const vehicle = lead.vehicles;
              const vehicleLabel = vehicle
                ? `${vehicle.brand} ${vehicle.model}`
                : null;
              const wa = buildWhatsAppUrl(
                lead.phone,
                buildLeadWhatsAppMessage({
                  clientName: lead.client_name,
                  vehicleLabel,
                }),
              );
              return (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDatePt(lead.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{lead.client_name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{typeLabel[lead.type] ?? lead.type}</TableCell>
                  <TableCell>
                    {vehicle ? (
                      <Link
                        href={`/veiculo/${vehicle.id}`}
                        className="font-medium text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {vehicle.brand} {vehicle.model}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                      <a href={wa} target="_blank" rel="noopener noreferrer">
                        Responder
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 lg:hidden">
        {leads.map((lead) => {
          const vehicle = lead.vehicles;
          const vehicleLabel = vehicle
            ? `${vehicle.brand} ${vehicle.model}`
            : null;
          const wa = buildWhatsAppUrl(
            lead.phone,
            buildLeadWhatsAppMessage({
              clientName: lead.client_name,
              vehicleLabel,
            }),
          );
          return (
            <li
              key={lead.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{lead.client_name}</p>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDatePt(lead.created_at)} ·{" "}
                    {typeLabel[lead.type] ?? lead.type}
                  </p>
                </div>
                <Button size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700" asChild>
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
              {vehicle ? (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Veículo: </span>
                  <Link
                    href={`/veiculo/${vehicle.id}`}
                    className="font-medium text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {vehicle.brand} {vehicle.model}
                  </Link>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
