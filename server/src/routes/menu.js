import { asc, eq, inArray } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/index.js'
import { menu, menuImage } from '../db/schema.js'

const router = Router()

async function getMenuItems(slug) {
  const menuItems = slug
    ? await db.select().from(menu).where(eq(menu.slug, slug)).limit(1)
    : await db.select().from(menu)

  if (menuItems.length === 0) {
    return []
  }

  const images = await db
    .select({
      id: menuImage.id,
      menuId: menuImage.menuId,
      imageUrl: menuImage.imageUrl,
      altText: menuImage.altText,
      position: menuImage.position,
    })
    .from(menuImage)
    .where(
      inArray(
        menuImage.menuId,
        menuItems.map(({ id }) => id),
      ),
    )
    .orderBy(asc(menuImage.position))

  const imagesByMenuId = new Map()
  for (const image of images) {
    const itemImages = imagesByMenuId.get(image.menuId) ?? []
    itemImages.push(image)
    imagesByMenuId.set(image.menuId, itemImages)
  }

  return menuItems.map((menuItem) => ({
    ...menuItem,
    menuImages: imagesByMenuId.get(menuItem.id) ?? [],
  }))
}

router.get('/', async (_req, res, next) => {
  try {
    const menuItems = await getMenuItems()
    res.json(menuItems)
  } catch (error) {
    next(error)
  }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const [menuItem] = await getMenuItems(req.params.slug)

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