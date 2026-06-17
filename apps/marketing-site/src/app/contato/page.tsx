import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { Separator } from "@autopainel/shared/ui";

import { ContactForm } from "@/components/contact-form";
import { CONTACT_EMAIL, LEGAL_SITE_URL } from "@/lib/legal/constants";
import { buildMarketingWhatsAppUrl, MARKETING_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Solicite uma demonstração do AutoPainel para sua concessionária. Planos sob consulta.",
  openGraph: {
    title: "Contato — AutoPainel",
    description:
      "Solicite uma demonstração do AutoPainel para sua concessionária. Planos sob consulta.",
    url: `${LEGAL_SITE_URL}/contato`,
  },
  alternates: { canonical: `${LEGAL_SITE_URL}/contato` },
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Vamos conversar
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Conte um pouco sobre a sua concessionária. Usamos essas informações apenas para
            retornar seu pedido de demonstração.
          </p>
          <Separator className="my-8 bg-white/10" />
          <ul className="space-y-6 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-5 shrink-0 text-marketing-accent" aria-hidden />
              <span>
                <span className="font-medium text-foreground">E-mail</span>
                <br />
                Resposta em até 1 dia útil:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-marketing-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-5 shrink-0 text-marketing-accent" aria-hidden />
              <span>
                <span className="font-medium text-foreground">WhatsApp</span>
                <br />
                <a
                  href={buildMarketingWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-marketing-accent hover:underline"
                >
                  {MARKETING_WHATSAPP_DISPLAY}
                </a>
                {" — ou deixe seu número no formulário."}
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-marketing-accent" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Atendimento</span>
                <br />
                Equipe comercial focada em concessionárias em todo o Brasil.
              </span>
            </li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
