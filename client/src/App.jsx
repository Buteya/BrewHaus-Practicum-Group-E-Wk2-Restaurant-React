import { useLayoutEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Footer from './components/Footer'
import Reservation from './components/Reservation'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import CheckoutSuccess from './components/CheckoutSuccess'
import Cart from './components/Cart'
import Profile from './components/Profile'

function App() {
  useLayoutEffect(() => {
    let menuObserver

    function scrollToHash() {
      menuObserver?.disconnect()

      const sectionId = window.location.hash.slice(1)
      const target = document.getElementById(sectionId)
      if (!target) return

      const menu = document.getElementById('menu')
      if (
        ['reservation', 'contact'].includes(sectionId) &&
        menu?.getAttribute('aria-busy') === 'true'
      ) {
        menuObserver = new MutationObserver(() => {
          if (menu.getAttribute('aria-busy') !== 'true') {
            menuObserver.disconnect()
            target.scrollIntoView()
          }
        })
        menuObserver.observe(menu, {
          attributes: true,
          attributeFilter: ['aria-busy'],
        })
        return
      }

      target.scrollIntoView()
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => {
      menuObserver?.disconnect()
      window.removeEventListener('hashchange', scrollToHash)
    }
  }, [])

  if (window.location.pathname === '/checkout/success') {
    return (
      <>
        <Header />
        <CheckoutSuccess />
        <Footer />
      </>
    )
  }

  if (window.location.pathname === '/login') {
    return (
      <>
        <Header />
        <main className="min-h-[55vh]">
          <Login />
        </main>
        <Footer />
      </>
    )
  }

  if (window.location.pathname === '/reset-password') {
    return (
      <>
        <Header />
        <main className="min-h-[55vh]">
          <ResetPassword />
        </main>
        <Footer />
      </>
    )
  }

  if (window.location.pathname === '/cart') {
    return (
      <>
        <Header />
        <Cart />
        <Footer />
      </>
    )
  }

  if (window.location.pathname === '/profile') {
    return (
      <>
        <Header />
        <Profile />
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Footer />
    </>
  )
}

export default App
