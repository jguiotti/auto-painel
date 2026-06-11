import { validateBuyerDocument } from "@autopainel/shared/lib/validators/buyer-document";
import type {
  SaleReceiptPaymentLine,
  SaleReceiptPaymentMethod,
  UpsertVehicleSaleReceiptInput,
} from "@autopainel/shared/types/sale-receipt";

const PAYMENT_METHODS = new Set<SaleReceiptPaymentMethod>([
  "cash",
  "pix",
  "card",
  "bank_transfer",
  "financing",
  "trade_in",
]);

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeSaleReceiptInput(input: UpsertVehicleSaleReceiptInput): {
  ok: true;
  value: UpsertVehicleSaleReceiptInput;
} | {
  ok: false;
  error: string;
} {
  const buyerName = input.buyer_name.trim();
  if (!buyerName) {
    return { ok: false, error: "Informe o nome completo do comprador." };
  }

  const documentResult = validateBuyerDocument(input.buyer_document);
  if (!documentResult.isValid) {
    return { ok: false, error: "Informe um CPF ou CNPJ válido." };
  }

  const billingAddress = input.buyer_billing_address.trim();
  if (!billingAddress) {
    return { ok: false, error: "Informe o endereço de cobrança do comprador." };
  }

  if (!Array.isArray(input.payment_lines) || input.payment_lines.length === 0) {
    return { ok: false, error: "Adicione ao menos uma forma de pagamento." };
  }

  const paymentLines: SaleReceiptPaymentLine[] = [];
  for (const line of input.payment_lines) {
    if (!PAYMENT_METHODS.has(line.method)) {
      return { ok: false, error: "Forma de pagamento inválida." };
    }
    const amount = roundMoney(Number(line.amount));
    if (Number.isNaN(amount) || amount <= 0) {
      return { ok: false, error: "Informe valores válidos em cada forma de pagamento." };
    }
    paymentLines.push({ method: line.method, amount });
  }

  const saleAmount = roundMoney(Number(input.sale_amount));
  if (Number.isNaN(saleAmount) || saleAmount <= 0) {
    return { ok: false, error: "Informe o valor total da venda." };
  }

  const paymentSum = roundMoney(
    paymentLines.reduce((total, line) => total + line.amount, 0),
  );
  if (paymentSum !== saleAmount) {
    return {
      ok: false,
      error: "A soma das formas de pagamento deve ser igual ao valor total da venda.",
    };
  }

  const downPayment =
    input.down_payment_amount === null || input.down_payment_amount === undefined
      ? null
      : roundMoney(Number(input.down_payment_amount));

  if (downPayment !== null && (Number.isNaN(downPayment) || downPayment < 0)) {
    return { ok: false, error: "Informe um valor de entrada válido." };
  }

  if (downPayment !== null && downPayment > saleAmount) {
    return { ok: false, error: "O valor de entrada não pode ser maior que o total da venda." };
  }

  return {
    ok: true,
    value: {
      ...input,
      buyer_name: buyerName,
      buyer_document: documentResult.normalized,
      buyer_billing_address: billingAddress,
      payment_lines: paymentLines,
      sale_amount: saleAmount,
      down_payment_amount: downPayment,
      vehicle_license_plate: input.vehicle_license_plate?.trim() || null,
      vehicle_renavam: input.vehicle_renavam?.trim() || null,
    },
  };
}
