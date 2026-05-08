"use client";

import { Input } from "@autopainel/shared/ui";
import { useState } from "react";

import {
  formatBrazilMobileMasked,
  formatCnpjMasked,
  normalizeDomainHostname,
} from "@/lib/br-format";

interface MaskedInputProps {
  disabled?: boolean;
}

export function CnpjMaskedInput({
  defaultValue,
  disabled,
}: MaskedInputProps & { defaultValue: string }) {
  const [value, setValue] = useState(() =>
    formatCnpjMasked(defaultValue),
  );

  return (
    <Input
      id="d-cnpj"
      name="cnpj"
      placeholder="00.000.000/0001-00"
      inputMode="numeric"
      autoComplete="organization"
      value={value}
      disabled={disabled}
      onChange={(event) => setValue(formatCnpjMasked(event.target.value))}
    />
  );
}

export function WhatsappMaskedInput({
  defaultValue,
  disabled,
}: MaskedInputProps & { defaultValue: string }) {
  const [value, setValue] = useState(() =>
    formatBrazilMobileMasked(defaultValue),
  );

  return (
    <Input
      id="d-wa"
      name="whatsapp_number"
      placeholder="(11) 98765-4321"
      inputMode="tel"
      autoComplete="tel"
      value={value}
      disabled={disabled}
      onChange={(event) =>
        setValue(formatBrazilMobileMasked(event.target.value))
      }
    />
  );
}

export function DomainMaskedInput({
  defaultValue,
  disabled,
}: MaskedInputProps & { defaultValue: string }) {
  const [value, setValue] = useState(() =>
    normalizeDomainHostname(defaultValue),
  );

  return (
    <Input
      id="d-domain"
      name="custom_domain"
      placeholder="www.minhaloja.com.br"
      autoComplete="url"
      spellCheck={false}
      value={value}
      disabled={disabled}
      onChange={(event) =>
        setValue(normalizeDomainHostname(event.target.value))
      }
    />
  );
}

export function EmailCadastroInput({
  defaultValue,
  disabled,
}: MaskedInputProps & { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue.trim());

  return (
    <Input
      id="d-email"
      name="contact_email"
      type="email"
      autoComplete="email"
      inputMode="email"
      placeholder="nome@empresa.com.br"
      value={value}
      disabled={disabled}
      onBlur={() => setValue((prev) => prev.trim().toLowerCase())}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

interface UrlMaskedProps extends MaskedInputProps {
  id: string;
  name: string;
  placeholder: string;
  defaultValue: string;
}

export function InstagramUrlMaskedInput({
  id,
  name,
  placeholder,
  defaultValue,
  disabled,
}: UrlMaskedProps) {
  const [value, setValue] = useState(defaultValue.trim());

  function normalizeInstagram(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    if (trimmed.startsWith("@")) {
      return `https://instagram.com/${trimmed.slice(1)}`;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  return (
    <Input
      id={id}
      name={name}
      type="url"
      placeholder={placeholder}
      spellCheck={false}
      value={value}
      disabled={disabled}
      onBlur={() => setValue((prev) => normalizeInstagram(prev))}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

export function FacebookUrlMaskedInput({
  id,
  name,
  placeholder,
  defaultValue,
  disabled,
}: UrlMaskedProps) {
  const [value, setValue] = useState(defaultValue.trim());

  return (
    <Input
      id={id}
      name={name}
      type="url"
      placeholder={placeholder}
      spellCheck={false}
      value={value}
      disabled={disabled}
      onBlur={() =>
        setValue((prev) => {
          const t = prev.trim();
          if (!t) {
            return "";
          }
          return /^https?:\/\//i.test(t) ? t : `https://${t}`;
        })
      }
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

export function WebsiteUrlMaskedInput({
  defaultValue,
  disabled,
}: MaskedInputProps & { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue.trim());

  return (
    <Input
      id="d-site"
      name="social_website"
      type="url"
      placeholder="https://www.sua-loja.com.br"
      spellCheck={false}
      value={value}
      disabled={disabled}
      onBlur={() =>
        setValue((prev) => {
          const t = prev.trim();
          if (!t) {
            return "";
          }
          return /^https?:\/\//i.test(t) ? t : `https://${t}`;
        })
      }
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
