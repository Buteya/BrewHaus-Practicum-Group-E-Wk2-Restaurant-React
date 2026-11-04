function About() {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-line px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto grid max-w-[1100px] overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_24px_70px_rgba(23,54,47,0.12)] md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[300px] bg-panel-sage md:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85"
            alt="A warmly lit table set for a restaurant meal"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
              The BrewHaus welcome
            </p>
            <p className="mt-2 max-w-sm font-serif text-2xl leading-snug font-semibold sm:text-3xl">
              Good food. Good company. Make yourself at home.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-7 py-9 sm:px-10 sm:py-12 lg:px-14">
          <p className="text-xs font-bold tracking-[0.22em] text-accent uppercase">
            Our story
          </p>
          <h2 className="mt-4 max-w-lg font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            A little more than a meal.
          </h2>
          <div className="mt-5 h-1 w-14 rounded-full bg-highlight" />
          <p className="mt-6 max-w-xl text-base leading-7 text-ink-soft">
            At BrewHaus, we believe dining is about the moments shared around
            the table. Our kitchen brings fresh ingredients and thoughtful
            flavors together, with every plate prepared with care.
          </p>
          <p className="mt-4 max-w-xl leading-7 text-ink-soft">
            From a slow morning coffee to a lively dinner with friends, we
            welcome every occasion with warm hospitality and food worth
            gathering for.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="#reservation"
              className="inline-block rounded-full bg-accent px-7 py-[0.85rem] font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Reserve Your Table
            </a>
            <span className="text-sm font-semibold text-ink-soft">
              Open daily for lunch and dinner
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About