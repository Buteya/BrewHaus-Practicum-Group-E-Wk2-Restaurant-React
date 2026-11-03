import { Router } from 'express'
import { db } from '../db/index.js'
import { reservations } from '../db/schema.js'

const router = Router()
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+()\d -]{7,32}$/

function getNairobiDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  )

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  }
}

function isValidDate(date) {
  if (!datePattern.test(date)) return false
  const parsedDate = new Date(`${date}T12:00:00.000Z`)
  return (
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  )
}

function getOpeningHours(date) {
  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay()
  return {
    opens: weekday === 0 ? '12:00' : '11:00',
    closes:
      weekday >= 1 && weekday <= 4
        ? '22:00'
        : weekday === 5 || weekday === 6
          ? '23:00'
          : '21:00',
  }
}

router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      reservationDate,
      reservationTime,
      partySize,
      notes,
    } = req.body ?? {}
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''
    const normalizedNotes =
      typeof notes === 'string' && notes.trim() ? notes.trim() : null
    const phoneDigits = normalizedPhone.replace(/\D/g, '')

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 120 ||
      normalizedEmail.length > 254 ||
      !emailPattern.test(normalizedEmail) ||
      !phonePattern.test(normalizedPhone) ||
      phoneDigits.length < 7 ||
      !isValidDate(reservationDate) ||
      typeof reservationTime !== 'string' ||
      !timePattern.test(reservationTime) ||
      !Number.isInteger(partySize) ||
      partySize < 1 ||
      partySize > 20 ||
      (normalizedNotes && normalizedNotes.length > 1000)
    ) {
      res.status(400).json({ error: 'Please check the reservation details.' })
      return
    }

    const currentNairobiTime = getNairobiDateTime()
    if (
      reservationDate < currentNairobiTime.date ||
      (reservationDate === currentNairobiTime.date &&
        reservationTime <= currentNairobiTime.time)
    ) {
      res.status(400).json({ error: 'Choose a future reservation time.' })
      return
    }

    const openingHours = getOpeningHours(reservationDate)
    if (
      reservationTime < openingHours.opens ||
      reservationTime >= openingHours.closes
    ) {
      res.status(400).json({
        error: `Choose a time between ${openingHours.opens} and ${openingHours.closes} Nairobi time.`,
      })
      return
    }

    const [reservation] = await db
      .insert(reservations)
      .values({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        reservationDate,
        reservationTime,
        partySize,
        notes: normalizedNotes,
      })
      .returning({
        id: reservations.id,
        reservationDate: reservations.reservationDate,
        reservationTime: reservations.reservationTime,
        partySize: reservations.partySize,
        status: reservations.status,
      })

    res.status(201).json(reservation)
  } catch (error) {
    next(error)
  }
})

export default router
