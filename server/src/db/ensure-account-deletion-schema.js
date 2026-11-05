import 'dotenv/config'
import postgres from 'postgres'

export async function ensureAccountDeletionSchema() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to prepare account deletion.')
  }

  const client = postgres(connectionString, { prepare: false, max: 1 })

  try {
    await client.begin(async (transaction) => {
      const foreignKeys = await transaction`
        SELECT constraint_info.conname, constraint_info.confdeltype
        FROM pg_constraint AS constraint_info
        JOIN pg_attribute AS column_info
          ON column_info.attrelid = constraint_info.conrelid
          AND column_info.attnum = ANY(constraint_info.conkey)
        WHERE constraint_info.contype = 'f'
          AND constraint_info.conrelid = 'public.orders'::regclass
          AND constraint_info.confrelid = '"public"."user"'::regclass
          AND column_info.attname = 'userId'
      `

      for (const foreignKey of foreignKeys) {
        if (foreignKey.confdeltype !== 'n') {
          const safeName = foreignKey.conname.replaceAll('"', '""')
          await transaction.unsafe(
            `ALTER TABLE "public"."orders" DROP CONSTRAINT "${safeName}"`,
          )
        }
      }

      await transaction`
        ALTER TABLE "public"."orders"
        ALTER COLUMN "userId" DROP NOT NULL
      `

      if (!foreignKeys.some(({ confdeltype }) => confdeltype === 'n')) {
        await transaction`
          ALTER TABLE "public"."orders"
          ADD CONSTRAINT "orders_userId_user_id_fk"
          FOREIGN KEY ("userId") REFERENCES "public"."user"("id")
          ON DELETE SET NULL
        `
      }
    })
  } finally {
    await client.end()
  }
}
