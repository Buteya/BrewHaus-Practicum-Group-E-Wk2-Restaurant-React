export function formatPrice(price) {
  const amount = Number(price)

  if (!Number.isFinite(amount)) {
    throw new TypeError('Price must be a finite number.')
  }

  return `KES ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}