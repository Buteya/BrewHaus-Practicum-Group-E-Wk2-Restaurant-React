function Hero() {
  return (
    <section id="hero" className="mx-auto w-full max-w-[1100px] px-4 pt-10 pb-12 sm:px-6 sm:pt-12 sm:pb-16">
      <p className="mb-4 text-sm tracking-[0.15rem] text-highlight uppercase">
        Make a reservation with us today.
      </p>
      <h1 className="max-w-[40rem] text-4xl leading-[1.05] font-bold sm:text-5xl md:text-[3.5rem]">
        Where <span className="text-accent">great food</span> meets great
        moments
      </h1>
      <p className="mt-5 max-w-[32rem] text-[1.1rem] text-ink-soft">
        Enjoy handcrafted meals, freshly brewed coffee, and a warm atmosphere
        designed for every occasion. Whether you&apos;re meeting friends,
        celebrating a special event, or enjoying a quiet meal, BrewHaus
        Restaurant is your table away from home.
      </p>
      <a
        href="#reservation"
        className="mt-8 inline-block rounded-full bg-accent px-7 py-[0.85rem] font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover"
      >
        Make a Reservation
      </a>
    </section>
  )
}

export default Hero