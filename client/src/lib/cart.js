export const userCartUpdatedEvent = 'brewhaus-user-cart-updated'

export function getUserCartStorageKey(userId) {
  return `brewhaus-cart:${userId}`
}

export function readUserCart(userId) {
  if (!userId) return []

  const savedCart = window.localStorage.getItem(getUserCartStorageKey(userId))
  if (!savedCart) return []

  const cart = JSON.parse(savedCart)
  if (
    !Array.isArray(cart) ||
    cart.some(
      (item) =>
        !item ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        (typeof item.price !== 'string' && typeof item.price !== 'number') ||
        !Number.isFinite(Number(item.price)) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    throw new Error('Saved cart data is invalid.')
  }

  return cart
}

export function writeUserCart(userId, cart) {
  if (!userId) {
    throw new Error('Sign in before saving items to your cart.')
  }

  window.localStorage.setItem(
    getUserCartStorageKey(userId),
    JSON.stringify(cart),
  )
  window.dispatchEvent(
    new CustomEvent(userCartUpdatedEvent, { detail: { userId } }),
  )
}

export function clearUserCart(userId) {
  writeUserCart(userId, [])
}

export function removePurchasedItemsFromUserCart(userId, purchasedItems) {
  const purchasedQuantities = new Map(
    purchasedItems
      .filter((item) => item.menuId)
      .map((item) => [item.menuId, item.quantity]),
  )

  if (purchasedQuantities.size === 0) return

  const remainingItems = readUserCart(userId)
    .map((item) => {
      const purchasedQuantity = purchasedQuantities.get(item.id)
      if (!purchasedQuantity) return item

      purchasedQuantities.delete(item.id)
      return { ...item, quantity: item.quantity - purchasedQuantity }
    })
    .filter((item) => item.quantity > 0)

  writeUserCart(userId, remainingItems)
}
