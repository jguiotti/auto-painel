/**
 * Blocks seed/reset scripts from running against hosted Supabase.
 * Demo users and db reset must never touch production data.
 */
export function assertSupabaseLocalOnly(supabaseUrl, scriptName) {
  const url = supabaseUrl?.trim() ?? "";
  const isLocal =
    url.includes("127.0.0.1:54321") ||
    url.includes("localhost:54321") ||
    url.includes("host.docker.internal:54321");

  if (!isLocal) {
    console.error(
      `\n[${scriptName}] ABORT: este script só pode rodar contra Supabase LOCAL (127.0.0.1:54321).\n` +
        `URL atual: ${url || "(vazio)"}\n\n` +
        `Para desenvolvimento diário com banco remoto, use apenas os apps Next.js apontando para\n` +
        `https://<project-ref>.supabase.co — NÃO rode seed:demo-users, seed:admin-user nem supabase:reset.\n` +
        `Ver packages/shared/docs/SUPABASE_REMOTE_DEV.md\n`,
    );
    process.exit(1);
  }
}
