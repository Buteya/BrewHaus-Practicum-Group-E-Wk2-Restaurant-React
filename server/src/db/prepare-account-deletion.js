import 'dotenv/config'
import { ensureAccountDeletionSchema } from './ensure-account-deletion-schema.js'

await ensureAccountDeletionSchema()
console.info('Account deletion database schema is ready.')
