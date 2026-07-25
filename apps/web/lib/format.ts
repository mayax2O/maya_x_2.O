export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Just the currency symbol (e.g. "₹" for INR) — used where the actual
 * price is masked (talent profile page) but the currency it *would* be
 * priced in still needs to show.
 */
export function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}
