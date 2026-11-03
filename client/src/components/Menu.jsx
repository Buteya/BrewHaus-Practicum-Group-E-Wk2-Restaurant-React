import { useEffect, useState } from 'react'
import { formatPrice } from '../lib/format'
import { readUserCart, writeUserCart } from '../lib/cart'
import { authClient } from '../lib/auth-client'
import QuantityStepper from './QuantityStepper'
import MenuDetail from './MenuDetail'

function Menu() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartState, setCartState] = useState({ userId: null, items: [] })
  const [cartMessage, setCartMessage] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [menuCategories, setMenuCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutItemId, setCheckoutItemId] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const { data: authSession, isPending: isSessionPending } =
    authClient.useSession()
  const currentUserId = authSession?.user?.id ?? null

  useEffect(() => {
    if (isSessionPending) return

    try {
      setCartState({
        userId: currentUserId,
        items: readUserCart(currentUserId),
      })
      setCheckoutError('')
    } catch (error) {
      setCartState({ userId: currentUserId, items: [] })
      setCheckoutError(
        error instanceof Error
          ? `Unable to load your saved cart: ${error.message}`
          : 'Unable to load your saved cart.',
      )
    }
  }, [currentUserId, isSessionPending])

  useEffect(() => {
    const controller = new AbortController()

    async function loadMenu() {
      try {
        const response = await fetch('/api/menu', { signal: controller.signal })

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
  async function handleCheckout(itemsToCheckout, itemId = null) {
    setCheckoutError('')
    if (itemsToCheckout.length === 0) {
      setCheckoutError('Add an item to your cart before checking out.')
      return
    }

    setIsCheckingOut(true)
    setCheckoutItemId(itemId)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: itemsToCheckout.map(({ id, quantity }) => ({
            menuId: id,
            quantity,
          })),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to start checkout.')
      }
      if (typeof result.url !== 'string') {
        throw new Error('Checkout did not return a payment link.')
      }

      window.location.assign(result.url)
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to start checkout.',
      )
      setIsCheckingOut(false)
      setCheckoutItemId(null)
    }
  }

  function orderNow(item) {
    return handleCheckout(
      [{ id: item.id, quantity: item.quantity }],
      item.id,
    )
  }

  function addToCart(selectedItem) {
    if (!currentUserId) {
      setCheckoutError('Sign in to add items to your cart.')
      return
    }

    const currentCart =
      cartState.userId === currentUserId ? cartState.items : []
    const existingItem = currentCart.find(
      ({ name }) => name === selectedItem.name,
    )
    const nextCart = existingItem
      ? currentCart.map((item) =>
          item.name === selectedItem.name
            ? { ...item, quantity: item.quantity + selectedItem.quantity }
            : item,
        )
      : [...currentCart, selectedItem]

    try {
      writeUserCart(currentUserId, nextCart)
      setCartState({ userId: currentUserId, items: nextCart })
      setCheckoutError('')
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? `Unable to save your cart: ${error.message}`
          : 'Unable to save your cart.',
      )
      return
    }

    setCartMessage(`${selectedItem.quantity} ${selectedItem.name} added to cart.`)
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
    <section
      id="menu"
      aria-busy={isLoading}
      className="scroll-mt-20 border-t border-line px-6 pt-12 pb-16"
    >
      <div className="mx-auto max-w-[1100px]">
        <h2 className="mb-[0.7rem] text-[1.75rem] font-bold">Our Menu</h2>
        <h3 className="mb-4 text-[1.05rem] font-semibold text-[#a5431f]">
          Popular Picks
        </h3>
        <p className="mb-[1.2rem] max-w-[42rem] text-ink-soft">
          Fresh ingredients, expertly crafted dishes, and a warm atmosphere
          designed for memorable moments.
        </p>
        {checkoutError && (
          <p className="mb-4 text-sm font-medium text-accent" role="alert">
            {checkoutError}
            {!currentUserId && (
              <>
                {' '}
                <a className="underline" href="/login">
                  Sign in
                </a>
              </>
            )}
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {cartMessage}
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
            onOrderNow={orderNow}
            isCheckingOut={isCheckingOut}
            checkoutItemId={checkoutItemId}
            checkoutError={checkoutError}
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
                      onOrderNow={orderNow}
                      isCheckingOut={isCheckingOut}
                      checkoutItemId={checkoutItemId}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Menu
