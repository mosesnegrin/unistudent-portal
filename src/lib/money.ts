const moneyPattern = /^\d+(,\d{2})?$/;

export function parseEuroInput(value?: string | null) {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  if (!moneyPattern.test(raw)) {
    throw new Error("Use whole euros like 5 or euros and cents like 5,30.");
  }
  const [euros, cents = "00"] = raw.split(",");
  return Number(euros) * 100 + Number(cents);
}

export function formatEuro(cents?: number | string | null) {
  const amount = Number(cents ?? 0);
  if (!amount) return "Free";
  const euros = Math.trunc(amount / 100);
  const rest = Math.abs(amount % 100);
  return rest ? `€${euros},${String(rest).padStart(2, "0")}` : `€${euros}`;
}

export const moneyInputPattern = "\\d+(,\\d{2})?";
