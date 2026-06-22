export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function resolveDefaultFromEmail(): string {
  const raw = process.env.AUTOPAINEL_TRANSACTIONAL_FROM_EMAIL?.trim();
  return raw && raw.length > 0 ? raw : "AutoPainel <noreply@autopainel.com.br>";
}

export function resolveDealershipFromEmail(dealershipName: string): string {
  const safeName = dealershipName.replace(/[<>"]/g, "").trim() || "Sua loja";
  return `${safeName} via AutoPainel <noreply@autopainel.com.br>`;
}

export interface SendResendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  tag?: string;
}

export type SendResendEmailResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error?: string };

export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<SendResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, error: "invalid_recipient" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: [to],
        subject: input.subject,
        html: input.html,
        tags: input.tag ? [{ name: "template", value: input.tag }] : undefined,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `resend_${response.status}:${text.slice(0, 200)}`,
      };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_failed";
    return { ok: false, error: message };
  }
}
