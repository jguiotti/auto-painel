import {
  buildAutopainelRecoveryEmailHtml,
  buildAutopainelWelcomeEmailHtml,
} from "./transactional-email-html";
import { resolveDefaultFromEmail, sendResendEmail } from "./resend-transport";

export type AutopainelTransactionalKind = "ADM-01" | "ADM-02";

interface SendAutopainelTransactionalEmailInput {
  kind: AutopainelTransactionalKind;
  to: string;
  recipientName?: string;
  actionLink: string;
  contextLabel?: string;
}

export async function sendAutopainelTransactionalEmail(
  input: SendAutopainelTransactionalEmailInput,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (input.kind === "ADM-01") {
    return sendResendEmail({
      from: resolveDefaultFromEmail(),
      to: input.to,
      subject: "Bem-vindo(a) ao Admin AutoPainel — defina sua senha",
      tag: "ADM-01",
      html: buildAutopainelWelcomeEmailHtml({
        recipientName: input.recipientName,
        actionLink: input.actionLink,
        contextLabel: input.contextLabel ?? "o painel central",
      }),
    });
  }

  return sendResendEmail({
    from: resolveDefaultFromEmail(),
    to: input.to,
    subject: "Redefinir senha — Admin AutoPainel",
    tag: "ADM-02",
    html: buildAutopainelRecoveryEmailHtml({
      actionLink: input.actionLink,
    }),
  });
}
