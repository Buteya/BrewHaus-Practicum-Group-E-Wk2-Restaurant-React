import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/index.js'
import { menu } from '../db/schema.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const menuItems = await db.select().from(menu)
    res.json(menuItems)
  } catch (error) {
    next(error)
  }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const [menuItem] = await db
      .select()
      .from(menu)
      .where(eq(menu.slug, req.params.slug))
      .limit(1)

    if (!menuItem) {
      res.status(404).json({ error: 'Menu item not found.' })
      return
    }

    res.json(menuItem)
  } catch (error) {
    next(error)
  }
})

export default router