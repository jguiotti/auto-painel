/**
 * Fixed monthly payment (PMT) for a constant nominal annual rate, compounded monthly.
 * @param principal Financed amount (same currency as payment).
 * @param annualInterestRatePercent Annual nominal rate in percent (e.g. 12 for 12% a.a.).
 * @param termMonths Number of installments.
 */
export function calculateFinanceInstallment(
  principal: number,
  annualInterestRatePercent: number,
  termMonths: number,
): number {
  if (termMonths <= 0 || principal <= 0) {
    return 0;
  }

  const monthlyRate = annualInterestRatePercent / 12 / 100;

  if (monthlyRate <= 0) {
    return principal / termMonths;
  }

  const factor = (1 + monthlyRate) ** termMonths;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateTotalFinancedAmount(
  installment: number,
  termMonths: number,
): number {
  if (termMonths <= 0) {
    return 0;
  }

  return installment * termMonths;
}
