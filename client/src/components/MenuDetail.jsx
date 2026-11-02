import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice } from '../lib/format'
import Footer from './Footer'
import Header from './Header'
import QuantityStepper from './QuantityStepper'

function MenuDetail({ item, onBack, onAddToCart }) {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  return createPortal(
    <div
      id="menu-detail"
      className="fixed inset-0 z-50 flex min-h-screen flex-col overflow-y-auto bg-bg"
    >
      <Header />
      <main className="w-full flex-1">
        <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 sm:py-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span aria-hidden="true">←</span> Back to menu
          </button>

          <div className="grid overflow-hidden border-y border-line bg-white md:grid-cols-2 md:rounded-3xl md:border md:shadow-[0_12px_36px_rgba(23,54,47,0.08)]">
            <img
              src={item.image}
              alt={item.name}
              className="h-64 w-full object-cover sm:h-80 md:h-full md:min-h-[560px]"
            />
            <div className="p-6 sm:p-8 md:p-10">
              <p className="text-sm font-semibold tracking-[0.12em] text-highlight uppercase">
                BrewHaus kitchen selection
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
                {item.name}
              </h1>
              <p className="mt-3 leading-relaxed text-ink-soft">
                {item.description}
              </p>
              <p className="mt-5 text-xl font-bold text-accent">
                {formatPrice(item.price)}
              </p>

              <div className="mt-7 space-y-6">
                <section aria-labelledby="preparation-heading">
                  <h2 id="preparation-heading" className="font-bold text-ink">
                    How it&apos;s prepared
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">
                    {item.preparation}
                  </p>
                </section>

                <section aria-labelledby="sides-heading">
                  <h2 id="sides-heading" className="font-bold text-ink">
                    Served with
                  </h2>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft marker:text-accent">
                    {item.sides.map((side) => (
                      <li key={side}>{side}</li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="drinks-heading">
                  <h2 id="drinks-heading" className="font-bold text-ink">
                    Recommended drinks
                  </h2>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft marker:text-accent">
                    {item.recommendedDrinks.map((drink) => (
                      <li key={drink}>{drink}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="mt-8 border-t border-line pt-5">
                <p className="mb-3 text-sm font-semibold text-ink">
                  Add this dish to your cart
                </p>
                <QuantityStepper item={item} onAddToCart={onAddToCart} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>,
    document.body,
  )
}

export default MenuDetail
