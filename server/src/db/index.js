import 'dotenv/config'
import {drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL
if(!connectionString){
    throw new Error('DATABASE_URL is missing. Copy. env.example to .env and paste your neon connection string.')
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export async function closeDb() {
  await client.end()
}