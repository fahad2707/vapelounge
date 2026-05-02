/** Storefront currency: Canadian dollars */
export function formatCad(amount: number): string {
  return `$${amount.toFixed(2)}`
}
