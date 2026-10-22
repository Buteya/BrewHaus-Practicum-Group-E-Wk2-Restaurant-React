function Reservation() {
  return (
    <section
      id="reservation"
      className="mx-auto max-w-[1100px] border-t border-line px-6 pt-12 pb-16"
    >
      <h2 className="mb-[0.7rem] text-[1.75rem] font-bold">
        Reserve Your Table
      </h2>
      <p className="max-w-[42rem] text-ink-soft">
        Plan your next dining experience with us.
      </p>
      <p className="max-w-[42rem] text-ink-soft">
        Book your table in just a few clicks and enjoy exceptional food,
        attentive service, and a welcoming atmosphere.
      </p>
      <a
        href="#reservation"
        className="mt-8 inline-block rounded-full bg-accent px-7 py-[0.85rem] font-semibold text-white transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover"
      >
        Reserve Now
      </a>
      <p className="max-w-[42rem] pt-4 text-ink-soft">
        For large group reservations, please contact us directly.
      </p>
    </section>
  )
}

export default Reservation
