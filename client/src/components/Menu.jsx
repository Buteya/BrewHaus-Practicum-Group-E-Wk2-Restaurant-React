import { useEffect, useState } from 'react'
import { formatPrice } from '../lib/format'
import QuantityStepper from './QuantityStepper'
import MenuDetail from './MenuDetail'

function Menu() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [cartMessage, setCartMessage] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [menuCategories, setMenuCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadMenu() {
      try {
        const response = await fetch('/api/menu', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Unable to load the menu (${response.status}).`)
        }

        const menuItems = await response.json()
        if (!Array.isArray(menuItems)) {
          throw new Error('The menu response has an unexpected format.')
        }

        const categories = new Map()
        for (const item of menuItems) {
          if (!categories.has(item.category)) {
            categories.set(item.category, {
              id: item.category,
              label: item.categoryLabel,
              items: [],
            })
          }
          categories.get(item.category).items.push(item)
        }

        setMenuCategories([...categories.values()])
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load the menu.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadMenu()
    return () => controller.abort()
  }, [])

  const filters = [{ id: 'all', label: 'All' }, ...menuCategories]
  const visibleItems =
    activeCategory === 'all'
      ? menuCategories.flatMap(({ items }) => items)
      : (menuCategories.find(({ id }) => id === activeCategory)?.items ?? [])
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)

  function addToCart(selectedItem) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        ({ name }) => name === selectedItem.name,
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.name === selectedItem.name
            ? { ...item, quantity: item.quantity + selectedItem.quantity }
            : item,
        )
      }

      return [...currentCart, selectedItem]
    })
    setCartMessage(
      `${selectedItem.quantity} ${selectedItem.name} added to your cart.`,
    )
  }

  function returnToMenu() {
    setSelectedItem(null)

    window.requestAnimationFrame(() => {
      const menuSection = document.getElementById('menu')
      if (!menuSection) return

      const header = document.querySelector('#root > header')
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const menuTop =
        window.scrollY + menuSection.getBoundingClientRect().top - headerHeight

      window.scrollTo({ top: Math.max(0, menuTop), behavior: 'instant' })
    })
  }

  return (
    <section id="menu" className="border-t border-line px-6 pt-12 pb-16">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="mb-[0.7rem] text-[1.75rem] font-bold">Our Menu</h2>
        <h3 className="mb-4 text-[1.05rem] font-semibold text-[#a5431f]">
          Popular Picks
        </h3>
        <p className="mb-[1.2rem] max-w-[42rem] text-ink-soft">
          Fresh ingredients, expertly crafted dishes, and a warm atmosphere
          designed for memorable moments.
        </p>

        <div
          className="mb-5 flex flex-wrap gap-[10px]"
          role="tablist"
          aria-label="Menu categories"
        >
          {filters.map(({ id, label }) => (
            <button
              key={id}
              id={`menu-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeCategory === id}
              aria-controls={`menu-panel-${id}`}
              tabIndex={activeCategory === id ? 0 : -1}
              onClick={() => setActiveCategory(id)}
              className={`rounded-full px-7 py-[0.85rem] font-semibold capitalize transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover ${
                activeCategory === id
                  ? 'bg-accent text-white'
                  : 'border border-line bg-white text-ink-soft hover:border-accent-hover hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-8 text-ink-soft" role="status">
            Loading menu...
          </p>
        ) : loadError ? (
          <p className="py-8 text-accent" role="alert">
            {loadError}
          </p>
        ) : selectedItem ? (
          <MenuDetail
            item={selectedItem}
            onBack={returnToMenu}
            onAddToCart={addToCart}
          />
        ) : (
          <div
            id={`menu-panel-${activeCategory}`}
            role="tabpanel"
            aria-labelledby={`menu-tab-${activeCategory}`}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visibleItems.map((item) => {
              const { name, image, description, price } = item

              return (
                <article
                  key={name}
                  className="overflow-hidden rounded-2xl border border-line transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(23,54,47,0.1)]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                    aria-label={`View details for ${name}`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-[220px] w-full object-cover"
                    />
                    <div className="px-4 pt-4 pb-2">
                      <h4 className="mb-1 text-base font-semibold">{name}</h4>
                      <p className="text-xs text-ink-soft">{description}</p>
                      <p className="mt-2 text-[0.95rem] font-semibold text-accent">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </button>
                  <div className="p-4 pt-3">
                    <QuantityStepper
                      item={item}
                      onAddToCart={addToCart}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <aside
          aria-label="Shopping cart"
          className="mt-8 rounded-2xl border border-line bg-white p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold">Your cart</h3>
            <p className="text-sm font-semibold text-accent">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          {cart.length > 0 ? (
            <ul className="mt-3 divide-y divide-line">
              {cart.map(({ name, quantity, price }) => (
                <li
                  key={name}
                  className="flex justify-between gap-4 py-2 text-sm"
                >
                  <span>{name}</span>
                  <span className="shrink-0 font-semibold text-ink-soft">
                    × {quantity} · {formatPrice(price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">
              Your cart is empty. Choose a dish to get started.
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {cartMessage}
          </p>
        </aside>
      </div>
    </section>
  )
}

export default Menu
