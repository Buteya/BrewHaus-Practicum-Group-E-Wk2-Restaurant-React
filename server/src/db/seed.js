import { pathToFileURL } from 'node:url'
import { sql } from 'drizzle-orm'
import { closeDb, db } from './index.js'
import { menuData } from './menu.data.js'
import { menu, menuImage } from './schema.js'

export async function seedMenu() {
  const { seededItems, seededImages } = await db.transaction(async (tx) => {
    const seededItems = await tx
      .insert(menu)
      .values(menuData)
      .onConflictDoUpdate({
        target: menu.slug,
        set: {
          name: sql`excluded."name"`,
          category: sql`excluded."category"`,
          categoryLabel: sql`excluded."categoryLabel"`,
          image: sql`excluded."image"`,
          description: sql`excluded."description"`,
          price: sql`excluded."price"`,
          currency: sql`excluded."currency"`,
          preparation: sql`excluded."preparation"`,
          sides: sql`excluded."sides"`,
          recommendedDrinks: sql`excluded."recommendedDrinks"`,
        },
      })
      .returning({ id: menu.id, slug: menu.slug })

    const menuItemsBySlug = new Map(
      seededItems.map(({ id, slug }) => [slug, id]),
    )
    const menuImages = menuData.map((item) => {
      const menuId = menuItemsBySlug.get(item.slug)
      if (!menuId) {
        throw new Error(`Could not find seeded menu item "${item.slug}".`)
      }

      return {
        menuId,
        imageUrl: item.image,
        altText: item.name,
        position: 0,
      }
    })

    const seededImages = await tx
      .insert(menuImage)
      .values(menuImages)
      .onConflictDoUpdate({
        target: [menuImage.menuId, menuImage.position],
        set: {
          imageUrl: sql`excluded."imageUrl"`,
          altText: sql`excluded."altText"`,
        },
      })
      .returning({ id: menuImage.id })

    return { seededItems, seededImages }
  })

  console.info(`Seeded ${seededItems.length} menu items.`)
  console.info(`Seeded ${seededImages.length} menu images.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await seedMenu()
  } catch (error) {
    console.error('Failed to seed menu:', error)
    process.exitCode = 1
  } finally {
    await closeDb()
  }
}