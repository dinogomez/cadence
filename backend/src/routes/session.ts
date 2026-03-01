import { Hono } from 'hono'
import { PERSONAS, SCENARIOS } from '../data.js'

const sanitize = (s: unknown, max = 500): string =>
  String(s ?? '').replace(/[\r\n]{3,}/g, '\n\n').slice(0, max)
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
    const { scenarioId, personaId, customScenario: rawCustomScenario } = body

    const basePersona = PERSONAS.find(p => p.id === personaId)
    const customScenario = rawCustomScenario ? {
      ...rawCustomScenario,
      title: sanitize(rawCustomScenario.title, 100),
      context: sanitize(rawCustomScenario.context, 500),
      policyFacts: (rawCustomScenario.policyFacts ?? []).map((f: unknown) => sanitize(f, 200)),
      ...(rawCustomScenario.personaNameOverride !== undefined ? { personaNameOverride: sanitize(rawCustomScenario.personaNameOverride, 60) } : {}),
      ...(rawCustomScenario.personaTypeOverride !== undefined ? { personaTypeOverride: sanitize(rawCustomScenario.personaTypeOverride, 60) } : {}),
    } : undefined
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
    const { scenarioId, personaId, agentName: rawAgentName, customScenario: rawCustomScenario } = body

    const safeAgentName = (rawAgentName ?? '').slice(0, 100)
    const basePersona = PERSONAS.find(p => p.id === personaId)
    const customScenario = rawCustomScenario ? {
      ...rawCustomScenario,
      title: sanitize(rawCustomScenario.title, 100),
      context: sanitize(rawCustomScenario.context, 500),
      policyFacts: (rawCustomScenario.policyFacts ?? []).map((f: unknown) => sanitize(f, 200)),
      ...(rawCustomScenario.personaNameOverride !== undefined ? { personaNameOverride: sanitize(rawCustomScenario.personaNameOverride, 60) } : {}),
      ...(rawCustomScenario.personaTypeOverride !== undefined ? { personaTypeOverride: sanitize(rawCustomScenario.personaTypeOverride, 60) } : {}),
    } : undefined
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
