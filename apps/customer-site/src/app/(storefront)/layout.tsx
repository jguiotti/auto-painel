import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  if (!dealership?.name) {
    return { title: "Vitrine" };
  }

  return {
    title: dealership.name,
    description: `Veículos e condições — ${dealership.name}`,
  };
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dealership = await getDealershipPublicRecord();
  if (!dealership?.id) {
    redirect("/erro/concessionaria");
  }

  return <StorefrontShell dealership={dealership}>{children}</StorefrontShell>;
}
