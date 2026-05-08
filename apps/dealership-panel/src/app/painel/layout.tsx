import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { supabase, dealershipId, profile } = await requireDashboardSession();

  const { data: dealership } = await supabase
    .from("dealerships")
    .select("name")
    .eq("id", dealershipId)
    .single();

  return (
    <DashboardShell
      dealershipName={dealership?.name ?? "Painel"}
      dealershipId={dealershipId}
      viewerRole={profile.role}
    >
      {children}
    </DashboardShell>
  );
}
