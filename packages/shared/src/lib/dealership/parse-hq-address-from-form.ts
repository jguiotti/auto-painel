import { digitsOnly } from "../br/format-input-masks";

export function parseHqAddressFromForm(
  formData: FormData,
  prefix = "hq",
): Record<string, string> {
  const postal = digitsOnly(String(formData.get(`${prefix}_postal_code`) ?? "")).slice(
    0,
    8,
  );
  const state = String(formData.get(`${prefix}_state`) ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  const city = String(formData.get(`${prefix}_city`) ?? "").trim();
  const district = String(formData.get(`${prefix}_district`) ?? "").trim();
  const street = String(formData.get(`${prefix}_street`) ?? "").trim();
  const number = String(formData.get(`${prefix}_number`) ?? "").trim();
  const complement = String(formData.get(`${prefix}_complement`) ?? "").trim();

  const out: Record<string, string> = {};
  if (postal.length === 8) {
    out.postal_code = postal;
  }
  if (state.length === 2) {
    out.state = state;
  }
  if (city) {
    out.city = city;
  }
  if (district) {
    out.district = district;
  }
  if (street) {
    out.street = street;
  }
  if (number) {
    out.number = number;
  }
  if (complement) {
    out.complement = complement;
  }
  return out;
}

export function mergeHqAddressIntoContentConfig(
  existingContent: Record<string, unknown>,
  hqAddress: Record<string, string>,
): Record<string, unknown> {
  const out = { ...existingContent };
  delete out.address;

  if (Object.keys(hqAddress).length > 0) {
    out.hq_address = hqAddress;
  } else {
    delete out.hq_address;
  }

  return out;
}
