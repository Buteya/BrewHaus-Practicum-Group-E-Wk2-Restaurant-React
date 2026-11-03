import { useState } from 'react'

function QuantityStepper({
  item,
  onAddToCart,
  onOrderNow,
  isCheckingOut = false,
  checkoutItemId = null,
}) {
  const [quantity, setQuantity] = useState(1)

  function handleAddToCart() {
    onAddToCart({ ...item, quantity })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center overflow-hidden rounded-full border border-line bg-white"
        role="group"
        aria-label={`Quantity for ${item.name}`}
      >
        <button
          type="button"
          aria-label={`Decrease ${item.name} quantity`}
          disabled={quantity <= 1}
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          className="grid size-10 place-items-center text-lg font-semibold text-ink transition-colors hover:bg-bg hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <output
          className="min-w-9 text-center text-sm font-semibold text-ink"
          aria-live="polite"
        >
          {quantity}
        </output>
        <button
          type="button"
          aria-label={`Increase ${item.name} quantity`}
          onClick={() => setQuantity((current) => current + 1)}
          className="grid size-10 place-items-center text-lg font-semibold text-ink transition-colors hover:bg-bg hover:text-accent"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={() => onOrderNow({ ...item, quantity })}
          disabled={isCheckingOut}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          {isCheckingOut && checkoutItemId === item.id
            ? 'Starting checkout...'
            : 'Order now'}
        </button>
      </div>
    </div>
  )
}

export default QuantityStepper
