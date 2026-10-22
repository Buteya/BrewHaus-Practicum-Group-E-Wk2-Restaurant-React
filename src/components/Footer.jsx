function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="text-[1.1rem] font-bold">
          <h2>
            Brew<span className="text-accent">Haus</span> Restaurant
          </h2>
          <p>Open daily for lunch and dinner.</p>
          <p className="mt-2 max-w-96 text-[0.9rem] font-normal text-ink-soft">
            From breakfast meetings and family lunches to romantic dinners and
            weekend gatherings, BrewHaus welcomes you with exceptional service
            and unforgettable tastes.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-base font-semibold">BrewHaus Restaurant</h3>
          <ul>
            <li>
              <a href="" className="text-sm text-ink-soft hover:text-accent">
                123 Garden Avenue, Nairobi, Kenya
              </a>
            </li>
            <li>
              <a
                href=""
                className="text-sm text-ink-soft hover:text-accent"
              >
                +254 700 123 456
              </a>
            </li>
            <li>
              <a
                href=""
                className="text-sm text-ink-soft hover:text-accent"
              >
                hello@brewhaus.co.ke
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-base font-semibold">Opening Hours</h3>
          <p className="text-sm">
            Monday - Thursday: 11:00 AM - 10:00 PM
          </p>
          <p className="text-sm">Friday - Saturday: 11:00 AM - 11:00 PM</p>
          <p className="text-sm">Sunday: 12:00 PM - 9:00 PM</p>
        </div>
      </div>
      <div className="mx-auto max-w-[1100px] border-t border-line px-6 py-5 text-[0.8rem] text-ink">
        <p>&copy; 2026 BrewHaus Restaurant. All rights reserved.</p>
        <p className="text-[0.8rem] font-normal">
          Crafted with passion. Served with excellence.
        </p>
      </div>
    </footer>
  )
}

export default Footer