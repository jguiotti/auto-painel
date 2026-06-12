/**
 * Returns a pt-BR message when required admin env vars are missing (Vercel / production).
 */
export function getAdminEnvSetupError(): string | null {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length === 0) {
    return null;
  }

  return `Variáveis ausentes no ambiente (Vercel → Settings → Environment Variables → Production): ${missing.join(", ")}. Use o Supabase remoto (https://wcgevmvystdhqpzwuyig.supabase.co), não 127.0.0.1. Depois redeploy.`;
}
