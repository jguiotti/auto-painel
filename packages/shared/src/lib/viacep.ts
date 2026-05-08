/**
 * ViaCEP open API — postal data aligned with Correios numbering (public REST).
 * Safe for browser fetch (CORS enabled). Do not use for bulk scraping.
 */

export interface ViaCepSuccessResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: true | string;
}

export interface BrazilianPostalLookupResult {
  postal_code: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement_hint?: string;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export async function lookupBrazilAddressByPostalCode(
  postalInput: string,
): Promise<{ ok: true; data: BrazilianPostalLookupResult } | { ok: false; message: string }> {
  const cep = onlyDigits(postalInput).slice(0, 8);
  if (cep.length !== 8) {
    return { ok: false, message: "Informe um CEP com 8 dígitos." };
  }

  const url = `https://viacep.com.br/ws/${cep}/json/`;
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", cache: "no-store" });
  } catch {
    return { ok: false, message: "Não foi possível consultar o CEP. Tente novamente." };
  }

  if (!response.ok) {
    return { ok: false, message: "Serviço de CEP indisponível no momento." };
  }

  let body: ViaCepSuccessResponse;
  try {
    body = (await response.json()) as ViaCepSuccessResponse;
  } catch {
    return { ok: false, message: "Resposta inválida do serviço de CEP." };
  }

  if (body.erro === true || body.erro === "true") {
    return { ok: false, message: "CEP não encontrado." };
  }

  return {
    ok: true,
    data: {
      postal_code: cep,
      street: typeof body.logradouro === "string" ? body.logradouro.trim() : "",
      district: typeof body.bairro === "string" ? body.bairro.trim() : "",
      city: typeof body.localidade === "string" ? body.localidade.trim() : "",
      state: typeof body.uf === "string" ? body.uf.trim().toUpperCase().slice(0, 2) : "",
      complement_hint:
        typeof body.complemento === "string" && body.complemento.trim().length > 0
          ? body.complemento.trim()
          : undefined,
    },
  };
}
