"use client";

import { useTransition } from "react";
import { CalendarDays } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { updateContentCalendarStatusAction } from "@/actions/platform-content-calendar";
import {
  CONTENT_CALENDAR_CHANNEL_LABELS,
  CONTENT_CALENDAR_STATUS_LABELS,
  CONTENT_CALENDAR_STATUSES,
  type ContentCalendarItemRow,
} from "@/lib/data/platform-content-calendar-shared";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

interface ContentCalendarTableProps {
  rows: ContentCalendarItemRow[];
}

export function ContentCalendarTable({ rows }: ContentCalendarTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(itemId: string, nextStatus: string) {
    startTransition(async () => {
      await updateContentCalendarStatusAction(itemId, nextStatus);
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Calendário vazio"
        description="Adicione peças pelo formulário abaixo para planejar publicações."
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDate(row.scheduled_for)}</TableCell>
              <TableCell>{CONTENT_CALENDAR_CHANNEL_LABELS[row.channel]}</TableCell>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell className="max-w-[180px] truncate text-muted-foreground">
                {row.objective ?? "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={row.status}
                  onValueChange={(value) => handleStatusChange(row.id, value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_CALENDAR_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {CONTENT_CALENDAR_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
