import { useState } from 'react'

function QunatityStepper({ item, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)

  function handleAddToCart() {
    onAddToCart({ ...item, quantity })
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="inline-flex items-center overflow-hidden rounded-full border border-line"
        aria-label={`Quantity for ${item.name}`}
      >
        <button
          type="button"
          aria-label={`Decrease ${item.name} quantity`}
          disabled={quantity <= 1}
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          className="px-3 py-1 text-ink-soft transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <output className="min-w-8 text-center" aria-live="polite">
          {quantity}
        </output>
        <button
          type="button"
          aria-label={`Increase ${item.name} quantity`}
          onClick={() => setQuantity((current) => current + 1)}
          className="px-3 py-1 text-ink-soft transition-colors hover:bg-bg"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Add to cart
      </button>
    </div>
  )
}

export default QunatityStepper
