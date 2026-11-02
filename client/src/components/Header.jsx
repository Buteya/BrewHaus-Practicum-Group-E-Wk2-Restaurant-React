function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg">
      <nav className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-3 px-4 py-3 sm:px-6 md:flex-row md:justify-between">
        <a href="#" className="shrink-0 text-lg font-bold sm:text-xl">
          Brew<span className="text-accent">Haus</span> Restaurant
        </a>
        <ul className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row md:gap-x-5">
          <li><a className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href="#hero">Home</a></li>
          <li><a className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href="#about">About</a></li>
          <li><a className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href="#menu">Menu</a></li>
          <li><a className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href="#reservation">Reservation</a></li>
          <li><a className="text-sm text-ink-soft transition-colors duration-150 hover:text-accent sm:text-[0.95rem]" href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default Header