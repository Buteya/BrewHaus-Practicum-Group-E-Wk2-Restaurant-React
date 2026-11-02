import 'dotenv/config'
import {defineConfig} from 'drizzle-kit'

export default defineConfig({
    schema: './src/db/schema.js',
    client: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
})