import { pathToFileURL } from 'node:url'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import { closeDb } from './db/index.js'
import menuRouter from './routes/menu.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)

app.all('/api/auth/{*path}', toNodeHandler(auth))
app.use(express.json())
app.use('/api/menu', menuRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error)
  res.status(500).json({ error: 'Internal server error.' })
})

export default app

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
}