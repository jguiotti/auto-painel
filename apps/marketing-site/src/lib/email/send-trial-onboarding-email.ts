import {
  DEFAULT_AUTOPAINEL_SITE_URL,
  resolveAutopainelSiteUrl,
} from "@autopainel/shared/lib/autopainel-site-url";

import { TRIAL_LIMITED_SPOTS } from "@/lib/legal/trial-constants";

export type TrialOnboardingEmailKind = "TRIAL-01" | "TRIAL-02";

interface SendTrialOnboardingEmailInput {
  to: string;
  recipientName: string;
  storeName: string;
  isWaitlist: boolean;
}

interface SendTrialOnboardingEmailResult {
  ok: boolean;
  kind?: TrialOnboardingEmailKind;
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

function buildTrial01Html(params: {
  recipientName: string;
  storeName: string;
  siteUrl: string;
}): string {
  const name = escapeHtml(params.recipientName);
  const store = escapeHtml(params.storeName);
  const termUrl = `${params.siteUrl}/termo-adesao-trial`;

  return `
    <div style="font-family:Arial,sans-serif;color:#18181b;max-width:560px;line-height:1.5;">
      <p style="font-size:14px;color:#71717a;margin:0 0 16px;">Adesão ao trial Essencial</p>
      <h1 style="font-size:22px;margin:0 0 12px;">Recebemos sua adesão, ${name}!</h1>
      <p style="margin:0 0 12px;">
        Registramos a adesão da loja <strong>${store}</strong> ao trial da AutoPainel.
        Nossa equipe comercial entrará em contato em até <strong>1 dia útil</strong> com os próximos passos.
      </p>
      <p style="margin:0 0 12px;">
        Enquanto isso, você pode consultar o termo de adesão:
        <a href="${termUrl}" style="color:#18181b;">${termUrl}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#71717a;">
        Se você não solicitou esta adesão, ignore este e-mail.
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:#71717a;">— Equipe AutoPainel<br />${params.siteUrl.replace(/^https?:\/\//, "")}</p>
    </div>
  `;
}

function buildTrial02Html(params: {
  recipientName: string;
  storeName: string;
  siteUrl: string;
}): string {
  const name = escapeHtml(params.recipientName);
  const store = escapeHtml(params.storeName);
  const termUrl = `${params.siteUrl}/termo-adesao-trial`;

  return `
    <div style="font-family:Arial,sans-serif;color:#18181b;max-width:560px;line-height:1.5;">
      <p style="font-size:14px;color:#71717a;margin:0 0 16px;">Fila de espera — trial Essencial</p>
      <h1 style="font-size:22px;margin:0 0 12px;">Você entrou na fila, ${name}</h1>
      <p style="margin:0 0 12px;">
        Registramos o interesse da loja <strong>${store}</strong> no trial Essencial da AutoPainel.
        As vagas com setup isento são limitadas (${TRIAL_LIMITED_SPOTS} lojas nesta campanha).
      </p>
      <p style="margin:0 0 12px;">
        Assim que abrir uma vaga, avisaremos por e-mail. Não é necessário responder a esta mensagem.
      </p>
      <p style="margin:0 0 12px;">
        Termo de adesão: <a href="${termUrl}" style="color:#18181b;">${termUrl}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#71717a;">
        Se você não solicitou participar da fila, ignore este e-mail.
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:#71717a;">— Equipe AutoPainel<br />${params.siteUrl.replace(/^https?:\/\//, "")}</p>
    </div>
  `;
}

export async function sendTrialOnboardingEmail(
  input: SendTrialOnboardingEmailInput,
): Promise<SendTrialOnboardingEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "invalid_recipient" };
  }

  const siteUrl = resolveAutopainelSiteUrl();
  const isWaitlist = input.isWaitlist;
  const kind: TrialOnboardingEmailKind = isWaitlist ? "TRIAL-02" : "TRIAL-01";
  const subject = isWaitlist
    ? "Você entrou na fila do trial Essencial — avisaremos quando abrir vaga"
    : "Recebemos sua adesão ao trial AutoPainel — próximo passo em até 1 dia útil";

  const html = isWaitlist
    ? buildTrial02Html({
        recipientName: input.recipientName,
        storeName: input.storeName,
        siteUrl,
      })
    : buildTrial01Html({
        recipientName: input.recipientName,
        storeName: input.storeName,
        siteUrl,
      });

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
        subject,
        html,
        tags: [{ name: "template", value: kind }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        kind,
        error: `resend_${response.status}:${text.slice(0, 200)}`,
      };
    }

    return { ok: true, kind };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_failed";
    return { ok: false, kind, error: message };
  }
}

export { DEFAULT_AUTOPAINEL_SITE_URL };
