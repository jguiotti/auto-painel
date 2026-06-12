import { redirect } from "next/navigation";

import { AdminEnvSetupRequired } from "@/components/admin-env-setup-required";
import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { getAdminEnvSetupError } from "@/lib/env/get-admin-env-setup-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const envError = getAdminEnvSetupError();
  if (envError) {
    return <AdminEnvSetupRequired message={envError} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { profile } = await fetchProfileRowForUserId(user.id);

    if (isPlatformOperatorProfile(profile)) {
      redirect("/painel/dashboard");
    }
  }

  redirect("/login");
}
