import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { readUserCart, userCartUpdatedEvent } from '../lib/cart'

function Header({ onSectionNavigate }) {
  const { data: session, isPending } = authClient.useSession()
  const navRef = useRef(null)
  const brandRef = useRef(null)
  const linksRef = useRef(null)
  const [isCompact, setIsCompact] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [cartCountState, setCartCountState] = useState({
    userId: null,
    count: 0,
  })
  const [cartError, setCartError] = useState('')
  const userId = session?.user?.id ?? null
  const showCartBadge = Boolean(
    isCompact &&
      !isMenuOpen &&
      !isPending &&
      userId &&
      cartCountState.userId === userId &&
      cartCountState.count > 0,
  )
  const sectionHref = (section) =>
    window.location.pathname === '/' ? `#${section}` : `/#${section}`

  useLayoutEffect(() => {
    function updateNavbarLayout() {
      const nav = navRef.current
      const brand = brandRef.current
      const links = linksRef.current
      if (!nav || !brand || !links) return

      const navStyle = window.getComputedStyle(nav)
      const expandedHeight =
        brand.getBoundingClientRect().height +
        links.getBoundingClientRect().height +
        (Number.parseFloat(navStyle.rowGap) || 0) +
        (Number.parseFloat(navStyle.paddingTop) || 0) +
        (Number.parseFloat(navStyle.paddingBottom) || 0)
      const shouldCollapse =
        window.matchMedia('(max-width: 767px)').matches &&
        expandedHeight > window.innerHeight / 3

      setIsCompact((current) =>
        current === shouldCollapse ? current : shouldCollapse,
      )
      if (!shouldCollapse) setIsMenuOpen(false)
    }

    updateNavbarLayout()
    window.addEventListener('resize', updateNavbarLayout)
    const observer = new ResizeObserver(updateNavbarLayout)
    if (navRef.current) observer.observe(navRef.current)
    if (brandRef.current) observer.observe(brandRef.current)
    if (linksRef.current) observer.observe(linksRef.current)

    return () => {
      window.removeEventListener('resize', updateNavbarLayout)
      observer.disconnect()
    }
  }, [
    cartCountState.count,
    cartCountState.userId,
    isPending,
    session?.user?.id,
  ])

  useEffect(() => {
    function closeMenuOnEscape(event) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', closeMenuOnEscape)
    return () => window.removeEventListener('keydown', closeMenuOnEscape)
  }, [])

  function handleSectionLinkClick(event) {
    setIsMenuOpen(false)
    onSectionNavigate?.(event)
  }

  function handleMenuLinkClick(event) {
    if (event.target.closest('a')) setIsMenuOpen(false)
  }

  useEffect(() => {
    if (isPending) return

    function updateCartCount() {
      try {
        const cart = readUserCart(userId)
        setCartCountState({
          userId,
          count: cart.reduce((total, item) => total + item.quantity, 0),
        })
        setCartError('')
      } catch (error) {
        setCartCountState({ userId, count: 0 })
        setCartError(
          error instanceof Error
            ? `Unable to read cart count: ${error.message}`
            : 'Unable to read cart count.',
        )
      }
    }

    function handleStorageChange(event) {
      if (event.key === null || event.key === `brewhaus-cart:${userId}`) {
        updateCartCount()
      }
    }

    function handleCartUpdate(event) {
      if (event.detail?.userId === userId) updateCartCount()
    }

    updateCartCount()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(userCartUpdatedEvent, handleCartUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(userCartUpdatedEvent, handleCartUpdate)
    }
  }, [isPending, userId])

  async function handleSignOut() {
    setIsMenuOpen(false)
    setSignOutError('')
    setIsSigningOut(true)

    try {
      const { error } = await authClient.signOut()
      if (error) {
        setSignOutError(error.message || 'Unable to sign out. Please try again.')
      }
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out. Please try again.',
      )
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg">
      <nav
        ref={navRef}
        className={`relative mx-auto flex w-full max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-6 ${
          isCompact
            ? 'flex-row justify-between'
            : 'flex-col md:flex-row md:justify-between'
        }`}
      >
        {isCompact && (
          <button
            type="button"
            aria-label={
              isMenuOpen
                ? 'Close navigation menu'
                : showCartBadge
                  ? `Open navigation menu, ${cartCountState.count} ${
                      cartCountState.count === 1 ? 'item' : 'items'
                    } in cart`
                  : 'Open navigation menu'
            }
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="relative inline-flex size-11 shrink-0 items-center justify-center text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {isMenuOpen ? (
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
            {showCartBadge && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-none text-white"
              >
                {cartCountState.count > 99 ? '99+' : cartCountState.count}
              </span>
            )}
          </button>
        )}
        <a
          ref={brandRef}
          href={sectionHref('hero')}
          onClick={handleSectionLinkClick}
          className={`shrink-0 text-lg font-bold sm:text-xl ${
            isCompact ? 'absolute left-1/2 -translate-x-1/2' : ''
          }`}
        >
          Brew<span className="text-accent">Haus</span> Restaurant
        </a>
        <ul
          ref={linksRef}
          id="primary-navigation"
          onClick={handleMenuLinkClick}
          className={`flex w-full flex-col items-center gap-2 md:w-auto md:flex-row md:gap-x-5 ${
            isCompact
              ? `absolute left-0 top-full z-30 rounded-b-2xl border-b border-line bg-bg px-4 pb-4 shadow-[0_12px_24px_rgba(23,54,47,0.12)] sm:px-6 ${
                  isMenuOpen
                    ? 'visible'
                    : 'invisible pointer-events-none'
                }`
              : 'md:static'
          }`}
        >
          <li><a onClick={handleSectionLinkClick} className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href={sectionHref('hero')}>Home</a></li>
          <li><a onClick={handleSectionLinkClick} className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href={sectionHref('about')}>About</a></li>
          <li><a onClick={handleSectionLinkClick} className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href={sectionHref('menu')}>Menu</a></li>
          {!isPending &&
            userId &&
            cartCountState.userId === userId &&
            cartCountState.count > 0 && (
              <li>
                <a
                  className="inline-flex items-center text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]"
                  href="/cart"
                  aria-label={`Cart, ${cartCountState.count} ${
                    cartCountState.count === 1 ? 'item' : 'items'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="text-center leading-tight">Cart</span>
                    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold leading-none text-white">
                      {cartCountState.count}
                    </span>
                  </span>
                </a>
              </li>
            )}
          <li><a onClick={onSectionNavigate} className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href={sectionHref('reservation')}>Reservation</a></li>
          <li><a onClick={onSectionNavigate} className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href={sectionHref('contact')}>Contact</a></li>
          <li className="relative">
            {isPending ? (
              <span className="text-sm text-ink-soft" role="status">
                Checking account...
              </span>
            ) : session?.user ? (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-[0.95rem] [&::-webkit-details-marker]:hidden">
                  {session.user.name?.trim() || 'Account'}
                  <svg
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </summary>
                <div className="absolute right-0 top-full z-20 mt-3 min-w-48 rounded-2xl border border-line bg-white p-2 shadow-[0_12px_36px_rgba(23,54,47,0.16)]">
                  <a
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-bg hover:text-accent"
                    href="/profile"
                  >
                    Profile &amp; orders
                  </a>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-ink-soft transition-colors hover:bg-bg hover:text-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </details>
            ) : (
              <a
                className="text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]"
                href="/login"
              >
                Sign in
              </a>
            )}
          </li>
        </ul>
        {signOutError && (
          <p className="text-sm font-medium text-accent" role="alert">
            {signOutError}
          </p>
        )}
        {cartError && (
          <p className="text-sm font-medium text-accent" role="alert">
            {cartError}
          </p>
        )}
      </nav>
    </header>
  )
}

export default Header