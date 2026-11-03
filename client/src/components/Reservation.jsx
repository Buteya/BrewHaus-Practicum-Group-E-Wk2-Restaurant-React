import { useState } from 'react'

function getNairobiDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function Reservation() {
  const [reservation, setReservation] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(event.currentTarget)
    const details = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      reservationDate: formData.get('reservationDate'),
      reservationTime: formData.get('reservationTime'),
      partySize: Number(formData.get('partySize')),
      notes: formData.get('notes'),
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit your reservation.')
      }
      if (typeof result.id !== 'string' || result.status !== 'requested') {
        throw new Error('The reservation service returned an invalid response.')
      }

      setReservation(result)
      form.reset()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit your reservation.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="reservation"
      className="scroll-mt-20 border-t border-line px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_24px_70px_rgba(23,54,47,0.12)] md:grid-cols-2">
        <aside className="overflow-hidden bg-panel-sage px-7 py-9 text-ink sm:px-10 sm:py-12 md:px-8 md:py-10 lg:px-12 lg:py-14">
          <p className="text-xs font-bold tracking-[0.22em] text-accent uppercase">
            A table is waiting
          </p>
          <h2 className="mt-5 max-w-sm font-serif text-4xl leading-tight font-semibold">
            Make room for a <span className="text-accent">lovely</span>{' '}
            evening.
          </h2>
          <p className="mt-5 max-w-sm leading-7 text-ink-soft">
            Gather around the table for good food, warm company, and moments
            worth savoring. Send us a request and we’ll help plan your visit.
          </p>

          <div className="mt-10 border-t border-ink/15 pt-7">
            <h3 className="text-sm font-bold tracking-[0.14em] text-accent uppercase">
              Opening hours
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Mon – Thu</dt>
                <dd className="text-right font-medium">11:00 AM – 10:00 PM</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Fri – Sat</dt>
                <dd className="text-right font-medium">11:00 AM – 11:00 PM</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Sunday</dt>
                <dd className="text-right font-medium">12:00 PM – 9:00 PM</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-white/50 p-4">
            <p className="text-sm text-ink-soft">
              Need a hand planning for a larger group?
            </p>
            <a
              className="mt-2 inline-flex font-semibold text-accent transition-colors hover:text-accent-hover"
              href="tel:+254700123456"
            >
              Call us: +254 700 123 456
            </a>
          </div>
        </aside>

        <div className="px-6 py-8 sm:px-10 sm:py-12 md:px-8 md:py-10 lg:px-12 lg:py-14">
          {reservation ? (
            <div
              className="flex h-full flex-col justify-center"
              role="status"
              aria-live="polite"
            >
              <span className="grid size-14 place-items-center rounded-full bg-bg text-accent">
                <svg
                  aria-hidden="true"
                  className="size-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </span>
              <p className="mt-6 text-xs font-bold tracking-[0.2em] text-accent uppercase">
                Request received
              </p>
              <h3 className="mt-2 text-3xl font-bold text-ink">
                Let’s make it a date.
              </h3>
              <p className="mt-4 leading-7 text-ink-soft">
                Your request is saved for{' '}
                <strong className="font-semibold text-ink">
                  {new Intl.DateTimeFormat('en-KE', {
                    timeZone: 'Africa/Nairobi',
                    dateStyle: 'long',
                  }).format(
                    new Date(`${reservation.reservationDate}T12:00:00+03:00`),
                  )}{' '}
                  at {reservation.reservationTime}
                </strong>{' '}
                for {reservation.partySize}{' '}
                {reservation.partySize === 1 ? 'guest' : 'guests'}. Please call
                or email us to confirm availability.
              </p>
              <p className="mt-4 text-sm text-ink-soft">
                <a
                  className="font-semibold text-accent hover:underline"
                  href="tel:+254700123456"
                >
                  +254 700 123 456
                </a>
                {' · '}
                <a
                  className="font-semibold text-accent hover:underline"
                  href="mailto:hello@brewhaus.co.ke"
                >
                  hello@brewhaus.co.ke
                </a>
              </p>
              <button
                type="button"
                onClick={() => setReservation(null)}
                className="mt-8 w-fit rounded-full border border-line px-5 py-3 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Make another reservation
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
                Your BrewHaus visit
              </p>
              <h3 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
                Reserve your table
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Tell us a little about your visit. We’ll save your request so
                our team can confirm your table.
              </p>

              <form
                className="mt-8 grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2"
                onSubmit={handleSubmit}
              >
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Full name
                  <input
                    autoComplete="name"
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition placeholder:text-ink-soft/60 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    maxLength={120}
                    minLength={2}
                    name="name"
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Email address
                  <input
                    autoComplete="email"
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition placeholder:text-ink-soft/60 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    maxLength={254}
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Phone number
                  <input
                    autoComplete="tel"
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition placeholder:text-ink-soft/60 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    maxLength={32}
                    name="phone"
                    placeholder="+254"
                    required
                    type="tel"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Number of guests
                  <input
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    max={20}
                    min={1}
                    name="partySize"
                    required
                    type="number"
                    defaultValue={2}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Date
                  <input
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    min={getNairobiDate()}
                    name="reservationDate"
                    required
                    type="date"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                  Time
                  <input
                    className="min-h-12 rounded-xl border border-line bg-bg/60 px-4 text-base font-normal outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    name="reservationTime"
                    required
                    type="time"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink lg:col-span-2">
                  Special requests{' '}
                  <span className="font-normal text-ink-soft">(optional)</span>
                  <textarea
                    className="min-h-24 resize-y rounded-xl border border-line bg-bg/60 px-4 py-3 text-base font-normal outline-none transition placeholder:text-ink-soft/60 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    maxLength={1000}
                    name="notes"
                    placeholder="Celebration, seating preference, or anything else we should know"
                    rows={3}
                  />
                </label>

                {errorMessage && (
                  <p
                    className="rounded-xl bg-accent/5 px-4 py-3 text-sm font-medium text-accent lg:col-span-2"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                <div className="mt-8 lg:col-span-2">
                  <button
                    className="w-full rounded-full bg-accent px-7 py-4 font-semibold text-white shadow-[0_8px_20px_rgba(189,63,97,0.2)] transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_12px_24px_rgba(189,63,97,0.26)] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-56"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Sending your request...' : 'Request a table'}
                  </button>
                  <p className="mt-4 text-xs leading-5 text-ink-soft">
                    Your reservation is a request until our team confirms
                    availability.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Reservation
