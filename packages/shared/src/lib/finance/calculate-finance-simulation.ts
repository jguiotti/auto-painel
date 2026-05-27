import { calculatePriceInstallment } from "./calculate-price-installment";

export const FINANCE_TERM_MONTHS_OPTIONS = [12, 24, 36, 48, 60] as const;

export type FinanceTermMonths = (typeof FINANCE_TERM_MONTHS_OPTIONS)[number];

/** Fixed IOF rate for consumer credit (Brazil). */
const IOF_ADDITIONAL_RATE = 0.0038;

/** Daily IOF rate for consumer credit (Brazil). */
const IOF_DAILY_RATE = 0.000082;

const IOF_MAX_DAYS = 365;

export interface FinanceSimulationInput {
  vehiclePrice: number;
  downPayment: number;
  monthlyInterestRatePercent: number;
  termMonths: FinanceTermMonths;
}

export interface FinanceSimulationResult {
  vehiclePrice: number;
  downPayment: number;
  financedAmount: number;
  estimatedIofAmount: number;
  principalWithIof: number;
  monthlyRatePercent: number;
  termMonths: FinanceTermMonths;
  estimatedInstallment: number;
  estimatedTotalPayable: number;
  estimatedTotalInterest: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateConsumerCreditIof(
  financedAmount: number,
  termMonths: number,
): number {
  if (financedAmount <= 0 || termMonths <= 0) {
    return 0;
  }

  const termDays = Math.min(termMonths * 30, IOF_MAX_DAYS);
  const additional = financedAmount * IOF_ADDITIONAL_RATE;
  const daily = financedAmount * IOF_DAILY_RATE * termDays;

  return roundCurrency(additional + daily);
}

export function calculateFinanceSimulation(
  input: FinanceSimulationInput,
): FinanceSimulationResult {
  const vehiclePrice = Number.isFinite(input.vehiclePrice)
    ? Math.max(0, input.vehiclePrice)
    : 0;
  const downPayment = Number.isFinite(input.downPayment)
    ? Math.max(0, Math.min(input.downPayment, vehiclePrice))
    : 0;
  const financedAmount = roundCurrency(Math.max(0, vehiclePrice - downPayment));
  const termMonths = input.termMonths;
  const monthlyRatePercent = Number.isFinite(input.monthlyInterestRatePercent)
    ? Math.max(0, input.monthlyInterestRatePercent)
    : 0;

  const estimatedIofAmount = estimateConsumerCreditIof(financedAmount, termMonths);
  const principalWithIof = roundCurrency(financedAmount + estimatedIofAmount);

  const priceResult = calculatePriceInstallment({
    financedAmount: principalWithIof,
    monthlyInterestRatePercent: monthlyRatePercent,
    termMonths,
  });

  return {
    vehiclePrice: roundCurrency(vehiclePrice),
    downPayment: roundCurrency(downPayment),
    financedAmount,
    estimatedIofAmount,
    principalWithIof,
    monthlyRatePercent,
    termMonths,
    estimatedInstallment: priceResult.installmentAmount,
    estimatedTotalPayable: priceResult.totalPayable,
    estimatedTotalInterest: roundCurrency(
      priceResult.totalInterest + estimatedIofAmount,
    ),
  };
}
