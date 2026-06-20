import { redirect } from "next/navigation";

import { AdminEnvSetupRequired } from "@/components/admin-env-setup-required";
import { resolvePostLoginRedirectPath } from "@/lib/auth/resolve-post-login-redirect";
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
    const redirectPath = await resolvePostLoginRedirectPath(user.id);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  redirect("/login");
}
