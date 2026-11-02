function About() {
  return (
    <section
      id="about"
      className="relative isolate border-t border-line px-6 pt-12 pb-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(115deg, rgba(243, 248, 244, 0.78), rgba(243, 248, 244, 0.68)), url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=85")',
        }}
      />
      <div className="mx-auto max-w-[1100px]">
        <h2 className="mb-[0.7rem] text-[1.75rem]">
          About BrewHaus Restaurant
        </h2>
        <h5 className="mb-4 text-[1.05rem] font-semibold text-accent">
          Crafted for Every Occasion
        </h5>
        <p className="max-w-[42rem] text-ink-soft">
          At BrewHaus, we believe dining is more than eating. It is about
          creating memorable experiences. Our chefs prepare every dish using
          fresh ingredients, carefully selected flavors, and a passion for
          quality.
        </p>
        <p className="max-w-[42rem] text-ink-soft">
          From breakfast meetings and family lunches to romantic dinners and
          weekend gatherings, BrewHaus welcomes you with exceptional service and
          unforgettable tastes.
        </p>
        <p className="max-w-[42rem] text-ink-soft">
          Reserve your table today and experience the difference.
        </p>
        <a
          href="#reservation"
          className="mt-8 inline-block rounded-full bg-accent px-7 py-[0.85rem] font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover"
        >
          Reserve Your Table
        </a>
        <p className="max-w-[42rem] pt-4 text-[0.95rem] font-semibold text-ink-soft">
          Open daily for lunch and dinner.
        </p>
      </div>
    </section>
  )
}

export default About