export interface PriceInstallmentInput {
  financedAmount: number;
  monthlyInterestRatePercent: number;
  termMonths: number;
}

export interface PriceInstallmentResult {
  financedAmount: number;
  monthlyInterestRatePercent: number;
  termMonths: number;
  installmentAmount: number;
  totalPayable: number;
  totalInterest: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePriceInstallment(
  input: PriceInstallmentInput,
): PriceInstallmentResult {
  const financedAmount = Number.isFinite(input.financedAmount)
    ? Math.max(0, input.financedAmount)
    : 0;
  const termMonths = Number.isFinite(input.termMonths)
    ? Math.max(0, Math.trunc(input.termMonths))
    : 0;
  const monthlyInterestRatePercent = Number.isFinite(input.monthlyInterestRatePercent)
    ? Math.max(0, input.monthlyInterestRatePercent)
    : 0;

  if (financedAmount <= 0 || termMonths <= 0) {
    return {
      financedAmount,
      monthlyInterestRatePercent,
      termMonths,
      installmentAmount: 0,
      totalPayable: 0,
      totalInterest: 0,
    };
  }

  const monthlyRate = monthlyInterestRatePercent / 100;
  let installmentAmount = 0;

  if (monthlyRate <= 0) {
    installmentAmount = financedAmount / termMonths;
  } else {
    const factor = (1 + monthlyRate) ** termMonths;
    installmentAmount = (financedAmount * monthlyRate * factor) / (factor - 1);
  }

  const totalPayable = installmentAmount * termMonths;
  const totalInterest = totalPayable - financedAmount;

  return {
    financedAmount: roundCurrency(financedAmount),
    monthlyInterestRatePercent,
    termMonths,
    installmentAmount: roundCurrency(installmentAmount),
    totalPayable: roundCurrency(totalPayable),
    totalInterest: roundCurrency(totalInterest),
  };
}
