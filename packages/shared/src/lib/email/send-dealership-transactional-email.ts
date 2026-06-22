import type { DealershipEmailBrand } from "./dealership-email-brand";
import {
  buildDealershipRecoveryEmailHtml,
  buildDealershipWelcomeEmailHtml,
  buildDealershipMemberDeactivatedEmailHtml,
} from "./transactional-email-html";
import {
  resolveDealershipFromEmail,
  resolveDefaultFromEmail,
  sendResendEmail,
} from "./resend-transport";

export type DealershipTransactionalKind = "LOJ-01" | "LOJ-02" | "LOJ-04";

interface SendDealershipTransactionalEmailInput {
  kind: DealershipTransactionalKind;
  to: string;
  recipientName?: string;
  role?: string;
  brand: DealershipEmailBrand;
  actionLink?: string;
}

export async function sendDealershipTransactionalEmail(
  input: SendDealershipTransactionalEmailInput,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const store = input.brand.dealershipName;

  if (input.kind === "LOJ-01") {
    return sendResendEmail({
      from: resolveDealershipFromEmail(store),
      to: input.to,
      subject: `${store} — seu acesso ao painel da loja`,
      tag: "LOJ-01",
      html: buildDealershipWelcomeEmailHtml({
        recipientName: input.recipientName ?? "",
        role: input.role ?? "seller",
        dealershipName: store,
        logoUrl: input.brand.logoUrl,
        primaryColor: input.brand.primaryColor,
        panelUrl: input.brand.panelUrl,
        actionLink: input.actionLink ?? "",
      }),
    });
  }

  if (input.kind === "LOJ-04") {
    return sendResendEmail({
      from: resolveDealershipFromEmail(store),
      to: input.to,
      subject: `${store} — acesso ao painel desativado`,
      tag: "LOJ-04",
      html: buildDealershipMemberDeactivatedEmailHtml({
        recipientName: input.recipientName ?? "",
        dealershipName: store,
        logoUrl: input.brand.logoUrl,
        primaryColor: input.brand.primaryColor,
      }),
    });
  }

  return sendResendEmail({
    from: resolveDealershipFromEmail(store),
    to: input.to,
    subject: `${store} — redefinir senha do painel`,
    tag: "LOJ-02",
    html: buildDealershipRecoveryEmailHtml({
      dealershipName: store,
      logoUrl: input.brand.logoUrl,
      primaryColor: input.brand.primaryColor,
      actionLink: input.actionLink ?? "",
    }),
  });
}
