const regularUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const exactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 5,
});

/**
 * Format USD to cents, marking non-zero sub-cent amounts rather than rounding
 * them to zero. Callers needing the supported five-decimal precision opt in
 * with `precision: "exact"`.
 */
export function formatMoney(
  amount: number,
  options?: Readonly<{ precision: "exact" }>,
): string {
  if (!Number.isFinite(amount))
    throw new RangeError("Money amount must be finite");
  const subcent = amount !== 0 && Math.abs(amount) < 0.01;
  if (subcent && (options?.precision !== "exact" || Math.abs(amount) < 0.00001))
    return amount < 0 ? ">-$0.01" : "<$0.01";
  return subcent ? exactUsd.format(amount) : regularUsd.format(amount);
}
