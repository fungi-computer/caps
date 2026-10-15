const regularUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const subcentUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 5,
});

/** Format USD with cents, preserving sub-cent precision without displaying non-zero amounts as zero. */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount))
    throw new RangeError("Money amount must be finite");
  if (amount !== 0 && Math.abs(amount) < 0.00001)
    return amount < 0 ? ">-$0.01" : "<$0.01";
  return amount !== 0 && Math.abs(amount) < 0.01
    ? subcentUsd.format(amount)
    : regularUsd.format(amount);
}
