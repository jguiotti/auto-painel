import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { StorefrontContactForm } from "@/components/storefront/storefront-contact-form";
import { buildGoogleMapsEmbedUrl } from "@/lib/address/format-brazilian-address";
import { getDealershipContactData } from "@/lib/tenant/get-dealership-contact-data";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  const name = dealership?.name ?? "Concessionária";
  return {
    title: `Contato — ${name}`,
    description: `Telefone, e-mail e endereço de ${name}.`,
  };
}

function formatPhoneDisplay(digits: string | null): string | null {
  if (!digits) {
    return null;
  }
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return digits;
}

export default async function ContatoPage() {
  const contact = await getDealershipContactData();
  if (!contact) {
    return null;
  }

  const phoneDisplay = formatPhoneDisplay(contact.whatsappNumber);
  const primaryMapAddress = contact.hqAddressLine;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-2xl">
        <h1
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--dealer-font-heading)" }}
        >
          Fale com a {contact.dealershipName}
        </h1>
        <p className="mt-3 text-[var(--dealer-fg)]/70">
          Estamos prontos para ajudar você a encontrar o veículo ideal. Use o formulário ou os
          canais abaixo.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <ul className="space-y-5 text-sm text-[var(--dealer-fg)]/80">
            {contact.contactEmail ? (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-[var(--dealer-primary)]" aria-hidden />
                <span>
                  <span className="font-medium text-[var(--dealer-fg)]">E-mail</span>
                  <br />
                  <a
                    href={`mailto:${contact.contactEmail}`}
                    className="text-[var(--dealer-primary)] hover:underline"
                  >
                    {contact.contactEmail}
                  </a>
                </span>
              </li>
            ) : null}
            {phoneDisplay ? (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-[var(--dealer-primary)]" aria-hidden />
                <span>
                  <span className="font-medium text-[var(--dealer-fg)]">Telefone / WhatsApp</span>
                  <br />
                  {phoneDisplay}
                </span>
              </li>
            ) : null}
            {primaryMapAddress ? (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-[var(--dealer-primary)]" aria-hidden />
                <span>
                  <span className="font-medium text-[var(--dealer-fg)]">Endereço (sede)</span>
                  <br />
                  {primaryMapAddress}
                </span>
              </li>
            ) : null}
          </ul>

          {primaryMapAddress ? (
            <div className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)]">
              <iframe
                title={`Mapa — ${contact.dealershipName}`}
                src={buildGoogleMapsEmbedUrl(primaryMapAddress)}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : null}

          {contact.units.length > 1 ? (
            <section aria-labelledby="units-heading">
              <h2
                id="units-heading"
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--dealer-font-heading)" }}
              >
                Unidades
              </h2>
              <ul className="mt-4 space-y-4">
                {contact.units.map((unit) => (
                  <li
                    key={unit.id}
                    className="rounded-xl border border-[color-mix(in_srgb,var(--dealer-primary)_12%,transparent)] p-4"
                  >
                    <p className="font-medium text-[var(--dealer-fg)]">{unit.name}</p>
                    {unit.addressLine ? (
                      <p className="mt-1 text-sm text-[var(--dealer-fg)]/70">{unit.addressLine}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <Card className="border-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)] bg-[var(--dealer-surface)]">
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--dealer-font-heading)" }}>
              Envie sua mensagem
            </CardTitle>
            <CardDescription className="text-[var(--dealer-fg)]/70">
              Nossa equipe retorna o mais rápido possível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StorefrontContactForm
              dealershipName={contact.dealershipName}
              source="contact_page"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
