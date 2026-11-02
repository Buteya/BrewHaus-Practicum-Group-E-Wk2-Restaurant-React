import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
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