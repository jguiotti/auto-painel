import { TRIAL_LIMITED_SPOTS } from "@/lib/legal/trial-constants";

export const TRIAL_CAMPAIGN_SETUP_WAIVER_LINE =
  "Excepcionalmente, não cobramos a taxa de setup de R$ 497 para os primeiros 20 lojistas da campanha.";

export const TRIAL_CAMPAIGN_WAITLIST_LINE =
  "Se as vagas imediatas estiverem preenchidas, você pode solicitar o trial mesmo assim e entrará na fila de espera — entraremos em contato quando abrirem novas vagas.";

export function trialCampaignAvailabilityHeadline(remainingSpots: number): string {
  if (remainingSpots <= 0) {
    return "Vagas imediatas esgotadas — fila de espera aberta";
  }
  if (remainingSpots === 1) {
    return "Resta 1 vaga imediata com setup isento";
  }
  return `Restam ${remainingSpots} de ${TRIAL_LIMITED_SPOTS} vagas imediatas com setup isento`;
}

export function trialCampaignAvailabilityDetail(remainingSpots: number): string {
  const base = `Campanha limitada aos primeiros ${TRIAL_LIMITED_SPOTS} lojistas interessados. ${TRIAL_CAMPAIGN_SETUP_WAIVER_LINE}`;
  if (remainingSpots <= 0) {
    return `${base} ${TRIAL_CAMPAIGN_WAITLIST_LINE}`;
  }
  return `${base} ${TRIAL_CAMPAIGN_WAITLIST_LINE}`;
}
