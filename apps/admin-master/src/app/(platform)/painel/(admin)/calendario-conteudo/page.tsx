import { ContentCalendarCreateForm } from "@/components/content-calendar-create-form";
import { ContentCalendarTable } from "@/components/content-calendar-table";
import { fetchContentCalendarItems } from "@/lib/data/platform-content-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarioConteudoPage() {
  const rows = await fetchContentCalendarItems();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendário de conteúdo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planejamento editorial AutoPainel — Instagram, LinkedIn, blog e campanhas.
        </p>
      </div>

      <ContentCalendarTable rows={rows} />
      <ContentCalendarCreateForm />
    </div>
  );
}
