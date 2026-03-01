import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { WebSocketServer } from 'ws'
import session from './routes/session.js'
import { handleCallConnection } from './ws/callHandler.js'
import { resolveVoiceMeta } from './services/voices.js'

const app = new Hono()
app.use('*', cors())
app.get('/health', (c) => c.json({ ok: true }))
app.route('/api/session', session)

const PORT = Number(process.env.PORT ?? 3001)

// serve() returns the http.Server in @hono/node-server >= 1.13
const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Cadence backend running on port ${info.port}`)
  resolveVoiceMeta()
})

// Attach WebSocket server to same http.Server
const wss = new WebSocketServer({ server: server as any })
wss.on('connection', handleCallConnection)
