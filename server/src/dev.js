import 'dotenv/config'
import app from './index.js'
import { closeDb } from './db/index.js'

const port = Number(process.env.PORT ?? 3000)
const server = app.listen(port, () => {
  console.info(`Server listening on port ${port}.`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async (error) => {
      if (error) {
        console.error('Failed to close server:', error)
        process.exitCode = 1
      }

      try {
        await closeDb()
      } catch (closeError) {
        console.error('Failed to close database connection:', closeError)
        process.exitCode = 1
      }
    })
  })
}
