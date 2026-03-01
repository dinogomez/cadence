import { Hono } from 'hono'
import { PERSONAS, SCENARIOS } from '../data.js'
import { synthesize } from '../services/tts.js'
import { generateOpeningLine, generateCustomerName, generateCallDetails } from '../services/llm.js'
import { pickVoiceId } from '../services/voices.js'
import type { EscalationLevel } from '../types.js'

const session = new Hono()

// Fast preview — generates customer name + call details only (no TTS).
// Called when the agent enters step 3 so the briefing shows real data before Start Call.
session.post('/preview', async (c) => {
  try {
    const body = await c.req.json()
    const { scenarioId, personaId, customScenario } = body

    const basePersona = PERSONAS.find(p => p.id === personaId)
    const scenario = customScenario ?? SCENARIOS.find(s => s.id === scenarioId)

    if (!basePersona || !scenario) {
      return c.json({ error: 'Invalid personaId or scenarioId' }, 400)
    }

    const customerName = await generateCustomerName(basePersona)
    const callDetails = await generateCallDetails({ customerName, scenario })

    return c.json({ customerName, callDetails })
  } catch (err) {
    console.error('Session preview error:', err)
    return c.json({ error: 'Failed to generate preview' }, 500)
  }
})

session.post('/start', async (c) => {
  try {
    const body = await c.req.json()
    const { scenarioId, personaId, agentName, customScenario } = body

    const basePersona = PERSONAS.find(p => p.id === personaId)
    const scenario = customScenario ?? SCENARIOS.find(s => s.id === scenarioId)

    if (!basePersona || !scenario) {
      return c.json({ error: 'Invalid personaId or scenarioId' }, 400)
    }

    const persona = customScenario
      ? {
          ...basePersona,
          ...(customScenario.personaNameOverride ? { name: customScenario.personaNameOverride } : {}),
          ...(customScenario.personaTypeOverride ? { type: customScenario.personaTypeOverride } : {}),
        }
      : basePersona

    const callMode: 'customer-first' | 'agent-first' = Math.random() < 0.5 ? 'customer-first' : 'agent-first'
    const voiceId = pickVoiceId(basePersona)

    // Reuse pre-generated data from /preview if provided, otherwise generate fresh
    const customerName: string = body.customerName ?? await generateCustomerName(basePersona)
    const callDetails = body.callDetails ?? await generateCallDetails({ customerName, scenario })

    const openingLine = callMode === 'customer-first'
      ? await generateOpeningLine({ persona, scenario, callDetails })
      : ''

    const openingAudioB64 = openingLine
      ? await synthesize(openingLine, voiceId, 'calm' as EscalationLevel)
      : null

    return c.json({
      sessionId: crypto.randomUUID(),
      callMode,
      openingLine: openingLine || null,
      openingAudioB64,
      customerName,
      callDetails,
      voiceId,
    })
  } catch (err) {
    console.error('Session start error:', err)
    return c.json({ error: 'Failed to start session' }, 500)
  }
})

export default session
