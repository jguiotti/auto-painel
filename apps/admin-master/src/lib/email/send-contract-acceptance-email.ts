import {
  DEFAULT_AUTOPAINEL_SITE_URL,
  resolveAutopainelSiteUrl,
} from "@autopainel/shared/lib/autopainel-site-url";

interface SendContractAcceptanceEmailInput {
  to: string;
  recipientName: string;
  storeName: string;
  acceptanceToken: string;
}

interface SendContractAcceptanceEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveFromEmail(): string {
  const raw = process.env.AUTOPAINEL_TRANSACTIONAL_FROM_EMAIL?.trim();
  return raw && raw.length > 0 ? raw : "AutoPainel <noreply@autopainel.com.br>";
}

export async function sendContractAcceptanceEmail(
  input: SendContractAcceptanceEmailInput,
): Promise<SendContractAcceptanceEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, error: "invalid_recipient" };
  }

  const siteUrl = resolveAutopainelSiteUrl() || DEFAULT_AUTOPAINEL_SITE_URL;
  const acceptUrl = `${siteUrl}/aceite-contrato/${encodeURIComponent(input.acceptanceToken)}`;
  const name = escapeHtml(input.recipientName);
  const store = escapeHtml(input.storeName);

  const html = `
    <div style="font-family:Arial,sans-serif;color:#18181b;max-width:560px;line-height:1.5;">
      <h1 style="font-size:22px;margin:0 0 12px;">Confirme seu contrato AutoPainel</h1>
      <p style="margin:0 0 12px;">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 12px;">
        Sua loja <strong>${store}</strong> está pronta para ativação na AutoPainel.
        Para continuar, leia o contrato e confirme os aceites no link abaixo.
      </p>
      <p style="margin:0 0 12px;">
        Pagamentos via <strong>Pix</strong>; nota fiscal em até <strong>3 dias</strong> após o pagamento.
      </p>
      <p style="margin:0 0 16px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;">
          Ler contrato e aceitar
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#71717a;">Dúvidas? WhatsApp +55 13 99743-5851 — respondemos em até 1 dia útil.</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resolveFromEmail(),
        to: [to],
        subject: `${input.storeName} — confirme seu contrato AutoPainel`,
        html,
        tags: [{ name: "template", value: "CONTRACT-ACCEPT" }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `resend_${response.status}:${text.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}
