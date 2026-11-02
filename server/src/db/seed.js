import { pathToFileURL } from 'node:url'
import { sql } from 'drizzle-orm'
import { closeDb, db } from './index.js'
import { menuData } from './menu.data.js'
import { menu } from './schema.js'

export async function seedMenu() {
  const seededItems = await db
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
    .returning({ slug: menu.slug })

  console.info(`Seeded ${seededItems.length} menu items.`)
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