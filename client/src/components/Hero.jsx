function Hero() {
  return (
    <section
      id="hero"
      className="scroll-mt-20 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-14"
    >
      <div className="mx-auto grid max-w-[1100px] overflow-hidden rounded-[2rem] border border-line bg-panel-sage shadow-[0_24px_70px_rgba(23,54,47,0.12)] md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-14 lg:px-14">
          <p className="self-start text-xs font-bold tracking-[0.16em] text-highlight uppercase">
            A seat at the table, just for you
          </p>
          <h1 className="mt-6 max-w-xl font-serif text-4xl leading-tight font-semibold text-ink lg:text-5xl">
            Come hungry.
            <br />
            <span className="text-accent">Leave delighted.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            From that first sip of coffee to one more bite shared with friends,
            discover fresh flavors and warm Nairobi hospitality at BrewHaus.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#menu"
              className="inline-block rounded-full bg-accent px-7 py-3 font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Explore the menu
            </a>
            <a
              href="#reservation"
              className="inline-block rounded-full border border-ink/15 bg-white/60 px-7 py-3 font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Book a table
            </a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-5 text-sm font-medium text-ink-soft">
            <span>Thoughtfully prepared</span>
            <span aria-hidden="true" className="text-highlight">
              •
            </span>
            <span>Made for good company</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-ink">
          <img
            src="/images/main/Mediterranean_Pasta.png"
            alt="Mediterranean pasta with vegetables and fresh herbs"
            className="absolute inset-0 size-full object-cover"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
