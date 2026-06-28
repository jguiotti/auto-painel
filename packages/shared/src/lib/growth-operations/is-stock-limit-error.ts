export function isStockLimitReachedError(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return normalized.includes("stock_limit_reached");
}
