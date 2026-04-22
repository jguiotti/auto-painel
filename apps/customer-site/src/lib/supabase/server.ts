import { createSupabaseServerClient as createSharedServerClient } from "@autopainel/shared/lib/supabase";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createSharedServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Component sem mutação de cookies.
      }
    },
  });
}
