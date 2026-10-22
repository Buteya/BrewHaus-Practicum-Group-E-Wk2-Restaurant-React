function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg">
      <nav className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
        <a href="#" className="text-xl font-bold">
          Brew<span className="text-accent">Haus</span> Restaurant
        </a>
        <ul className="flex gap-6">
          <li><a className="text-[0.95rem] text-ink-soft transition-colors duration-150 hover:text-accent" href="#hero">Home</a></li>
          <li><a className="text-[0.95rem] text-ink-soft transition-colors duration-150 hover:text-accent" href="#about">About</a></li>
          <li><a className="text-[0.95rem] text-ink-soft transition-colors duration-150 hover:text-accent" href="#menu">Menu</a></li>
          <li><a className="text-[0.95rem] text-ink-soft transition-colors duration-150 hover:text-accent" href="#reservation">Reservation</a></li>
          <li><a className="text-[0.95rem] text-ink-soft transition-colors duration-150 hover:text-accent" href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default Header