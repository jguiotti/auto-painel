import {
  AUTOPAINEL_EMAIL_PRIMARY,
  resolveAutopainelTransactionalLogoUrl,
} from "./autopainel-email-brand";
import { escapeHtml } from "./resend-transport";

interface TransactionalEmailLayoutInput {
  logoUrl: string | null;
  logoAlt: string;
  preheader?: string;
  bodyHtml: string;
  footerHtml: string;
  primaryColor: string;
}

function buildTransactionalEmailLayout(input: TransactionalEmailLayoutInput): string {
  const logoBlock = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(input.logoAlt)}" width="200" style="max-width:200px;height:auto;" />`
    : `<p style="margin:0;font-size:20px;font-weight:600;color:#18181b;">${escapeHtml(input.logoAlt)}</p>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;color:#18181b;font-size:15px;line-height:1.6;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;font-size:12px;color:#71717a;line-height:1.5;">
              ${input.footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildCtaButton(label: string, href: string, primaryColor: string): string {
  return `<p style="margin:0 0 24px;text-align:center;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">${escapeHtml(label)}</a>
  </p>`;
}

export function buildAutopainelWelcomeEmailHtml(params: {
  recipientName?: string;
  actionLink: string;
  contextLabel: string;
}): string {
  const greeting = params.recipientName?.trim()
    ? `Olá, ${escapeHtml(params.recipientName.trim())}!`
    : "Olá!";
  const bodyHtml = `
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Sua conta na <strong>AutoPainel</strong> foi criada. Para acessar ${escapeHtml(params.contextLabel)}, defina sua senha clicando no botão abaixo.</p>
    ${buildCtaButton("Definir minha senha", params.actionLink, AUTOPAINEL_EMAIL_PRIMARY)}
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Este link expira em 1 hora. Se você não solicitou este acesso, ignore este e-mail.</p>
  `;

  return buildTransactionalEmailLayout({
    logoUrl: resolveAutopainelTransactionalLogoUrl(),
    logoAlt: "AutoPainel",
    bodyHtml,
    footerHtml: `© AutoPainel · <a href="https://autopainel.com.br" style="color:#71717a;">autopainel.com.br</a>`,
    primaryColor: AUTOPAINEL_EMAIL_PRIMARY,
  });
}

export function buildAutopainelRecoveryEmailHtml(params: {
  actionLink: string;
}): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Olá!</p>
    <p style="margin:0 0 16px;">Recebemos um pedido para redefinir a senha da sua conta no <strong>Admin AutoPainel</strong>.</p>
    ${buildCtaButton("Criar nova senha", params.actionLink, AUTOPAINEL_EMAIL_PRIMARY)}
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Se não foi você, ignore este e-mail — sua senha permanece a mesma.</p>
  `;

  return buildTransactionalEmailLayout({
    logoUrl: resolveAutopainelTransactionalLogoUrl(),
    logoAlt: "AutoPainel",
    bodyHtml,
    footerHtml: `© AutoPainel · <a href="https://autopainel.com.br" style="color:#71717a;">autopainel.com.br</a>`,
    primaryColor: AUTOPAINEL_EMAIL_PRIMARY,
  });
}

const INVITE_ROLE_LABELS: Record<string, string> = {
  owner: "titular da loja",
  manager: "gestor(a)",
  seller: "vendedor(a)",
};

export function buildDealershipWelcomeEmailHtml(params: {
  recipientName: string;
  role: string;
  dealershipName: string;
  logoUrl: string | null;
  primaryColor: string;
  panelUrl: string;
  actionLink: string;
}): string {
  const name = escapeHtml(params.recipientName.trim() || "Olá");
  const store = escapeHtml(params.dealershipName);
  const roleLabel = escapeHtml(
    INVITE_ROLE_LABELS[params.role] ?? "colaborador(a) da loja",
  );
  const bodyHtml = `
    <p style="margin:0 0 16px;">Olá, ${name}!</p>
    <p style="margin:0 0 16px;">Você foi convidado(a) para acessar o painel da <strong>${store}</strong> como <strong>${roleLabel}</strong>.</p>
    ${buildCtaButton("Criar minha senha", params.actionLink, params.primaryColor)}
    <p style="margin:0 0 12px;">No painel você pode gerenciar estoque, leads e integrações conforme seu perfil de acesso.</p>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Painel: ${escapeHtml(params.panelUrl)}</p>
    <p style="margin:0;font-size:13px;color:#71717a;">Este link expira em 1 hora. Se você não esperava este convite, ignore este e-mail.</p>
  `;

  return buildTransactionalEmailLayout({
    logoUrl: params.logoUrl,
    logoAlt: params.dealershipName,
    bodyHtml,
    footerHtml: `— ${store}<br />Plataforma <a href="https://autopainel.com.br" style="color:#71717a;">AutoPainel</a>`,
    primaryColor: params.primaryColor,
  });
}

export function buildDealershipRecoveryEmailHtml(params: {
  dealershipName: string;
  logoUrl: string | null;
  primaryColor: string;
  actionLink: string;
}): string {
  const store = escapeHtml(params.dealershipName);
  const bodyHtml = `
    <p style="margin:0 0 16px;">Olá!</p>
    <p style="margin:0 0 16px;">Recebemos um pedido para redefinir a senha do painel da <strong>${store}</strong>.</p>
    ${buildCtaButton("Criar nova senha", params.actionLink, params.primaryColor)}
    <p style="margin:0;font-size:13px;color:#71717a;">Se não foi você, ignore este e-mail — sua senha permanece a mesma.</p>
  `;

  return buildTransactionalEmailLayout({
    logoUrl: params.logoUrl,
    logoAlt: params.dealershipName,
    bodyHtml,
    footerHtml: `— ${store}<br />Plataforma <a href="https://autopainel.com.br" style="color:#71717a;">AutoPainel</a>`,
    primaryColor: params.primaryColor,
  });
}

export function buildDealershipMemberDeactivatedEmailHtml(params: {
  recipientName: string;
  dealershipName: string;
  logoUrl: string | null;
  primaryColor: string;
}): string {
  const name = escapeHtml(params.recipientName.trim() || "Olá");
  const store = escapeHtml(params.dealershipName);
  const bodyHtml = `
    <p style="margin:0 0 16px;">Olá, ${name}!</p>
    <p style="margin:0 0 16px;">Informamos que seu acesso ao painel da <strong>${store}</strong> foi <strong>desativado</strong> pelo titular da loja.</p>
    <p style="margin:0 0 16px;">Você não poderá mais entrar no painel desta concessionária. Se acredita que isso é um erro, entre em contato diretamente com a loja.</p>
    <p style="margin:0;font-size:13px;color:#71717a;">Este e-mail é apenas informativo — não é necessário responder.</p>
  `;

  return buildTransactionalEmailLayout({
    logoUrl: params.logoUrl,
    logoAlt: params.dealershipName,
    bodyHtml,
    footerHtml: `— ${store}<br />Plataforma <a href="https://autopainel.com.br" style="color:#71717a;">AutoPainel</a>`,
    primaryColor: params.primaryColor,
  });
}
