import type { WebSocket } from 'ws'
import { transcribe } from '../services/stt.js'
import { synthesize } from '../services/tts.js'
import { generateCustomerResponse, evaluateTurn, generateFinalScorecard } from '../services/llm.js'
import { PERSONAS, SCENARIOS } from '../data.js'
import { pickVoiceId } from '../services/voices.js'
import type { EscalationLevel, TurnEvaluation } from '../types.js'

const sanitize = (s: unknown, max = 500): string =>
  String(s ?? '').replace(/[\r\n]{3,}/g, '\n\n').slice(0, max)

interface Turn { speaker: 'agent' | 'customer'; text: string }

function send(ws: WebSocket, data: object) {
  ws.send(JSON.stringify(data))
}

export function handleCallConnection(ws: WebSocket) {
  const sessionEvals: TurnEvaluation[] = []
  let turnCount = 0

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      // Handle agent-initiated end call
      if (msg.type === 'end_call') {
        const { history, scenarioId, personaId, agentName: rawAgentName, customScenario: rawCustomScenario } = msg as {
          history: Turn[]
          scenarioId: string
          personaId: string
          agentName: string
          customScenario?: { title: string; context: string; policyFacts: string[]; personaNameOverride?: string; personaTypeOverride?: string }
        }
        const safeAgentName = (rawAgentName ?? '').slice(0, 100)
        const customScenario = rawCustomScenario ? {
          ...rawCustomScenario,
          title: sanitize(rawCustomScenario.title, 100),
          context: sanitize(rawCustomScenario.context, 500),
          policyFacts: (rawCustomScenario.policyFacts ?? []).map(f => sanitize(f, 200)),
          ...(rawCustomScenario.personaNameOverride !== undefined ? { personaNameOverride: sanitize(rawCustomScenario.personaNameOverride, 60) } : {}),
          ...(rawCustomScenario.personaTypeOverride !== undefined ? { personaTypeOverride: sanitize(rawCustomScenario.personaTypeOverride, 60) } : {}),
        } : undefined
        const scenario = customScenario ?? SCENARIOS.find(s => s.id === scenarioId)
        if (!scenario) {
          send(ws, { type: 'error', message: 'Invalid scenario' })
          return
        }
        // No agent turns — nothing to score
        const agentTurns = history.filter(t => t.speaker === 'agent')
        if (agentTurns.length === 0) {
          send(ws, { type: 'final_scorecard', scorecard: null })
          return
        }
        const scorecard = await generateFinalScorecard({
          history,
          turnEvaluations: sessionEvals,
          scenarioTitle: scenario.title,
          agentName: safeAgentName,
        })
        send(ws, { type: 'final_scorecard', scorecard })
        return
      }

      if (msg.type !== 'turn') return
      console.log('[ws] turn received, audioB64 length:', msg.audioB64?.length ?? 0)

      const {
        audioB64, history, escalationLevel, scenarioId, personaId, agentName: rawAgentName, customScenario: rawCustomScenario, customerName, callMode, callDetails
      } = msg as {
        audioB64: string
        history: Turn[]
        escalationLevel: EscalationLevel
        scenarioId: string
        personaId: string
        agentName: string
        customScenario?: { title: string; context: string; policyFacts: string[]; personaNameOverride?: string; personaTypeOverride?: string }
        customerName?: string
        callMode?: 'customer-first' | 'agent-first'
        callDetails?: { summary: string; details: { label: string; value: string }[] } | null
      }

      if (!audioB64 || audioB64.length > 2_000_000) {
        send(ws, { type: 'error', message: 'Audio too large or missing' })
        return
      }

      const safeAgentName = (rawAgentName ?? '').slice(0, 100)
      const customScenario = rawCustomScenario ? {
        ...rawCustomScenario,
        title: sanitize(rawCustomScenario.title, 100),
        context: sanitize(rawCustomScenario.context, 500),
        policyFacts: (rawCustomScenario.policyFacts ?? []).map(f => sanitize(f, 200)),
        ...(rawCustomScenario.personaNameOverride !== undefined ? { personaNameOverride: sanitize(rawCustomScenario.personaNameOverride, 60) } : {}),
        ...(rawCustomScenario.personaTypeOverride !== undefined ? { personaTypeOverride: sanitize(rawCustomScenario.personaTypeOverride, 60) } : {}),
      } : undefined

      turnCount++
      const currentTurn = turnCount

      const basePersona = PERSONAS.find(p => p.id === personaId)
      const scenario = customScenario ?? SCENARIOS.find(s => s.id === scenarioId)
      const persona = basePersona && customScenario
        ? {
            ...basePersona,
            ...(customScenario.personaNameOverride ? { name: customScenario.personaNameOverride } : {}),
            ...(customScenario.personaTypeOverride ? { type: customScenario.personaTypeOverride } : {}),
          }
        : basePersona

      if (!persona || !scenario) {
        send(ws, { type: 'error', message: 'Invalid persona or scenario' })
        return
      }

      // Step 1: STT
      const agentText = await transcribe(audioB64)
      send(ws, { type: 'agent_transcript', text: agentText, turn: currentTurn })

      const isAgentFirstOpening = callMode === 'agent-first' && history.length === 0

      // Step 2: Parallel AI calls (skip evaluation on agent-first opening — no problem stated yet)
      const [evaluation, customerResult] = await Promise.all([
        isAgentFirstOpening
          ? Promise.resolve(null)
          : evaluateTurn({ agentText, policyFacts: scenario.policyFacts, turnNumber: currentTurn, history }),
        generateCustomerResponse({ persona, scenario, escalationLevel, history, agentText, agentName: safeAgentName, customerName, callMode, callDetails }),
      ])

      if (evaluation) {
        sessionEvals.push(evaluation)
        send(ws, { type: 'turn_evaluation', evaluation, turn: currentTurn })
      }

      // Step 3: TTS for customer response
      const resolvedVoiceId = pickVoiceId(persona)
      const audioB64Out = await synthesize(customerResult.text, resolvedVoiceId, customerResult.newEscalation)
      send(ws, {
        type: 'customer_response',
        text: customerResult.text,
        audioB64: audioB64Out,
        escalation: customerResult.newEscalation,
        isEnd: customerResult.isEnd,
        endCondition: customerResult.endCondition,
      })

      // Step 4: Final scorecard if call ended
      if (customerResult.isEnd) {
        const allTurns: Turn[] = [
          ...history,
          { speaker: 'agent', text: agentText },
          { speaker: 'customer', text: customerResult.text },
        ]
        const scorecard = await generateFinalScorecard({
          history: allTurns,
          turnEvaluations: sessionEvals,
          scenarioTitle: scenario.title,
          agentName: safeAgentName,
        })
        send(ws, { type: 'final_scorecard', scorecard })
      }
    } catch (err) {
      console.error('callHandler error:', err)
      send(ws, { type: 'error', message: 'An error occurred. Please try again.' })
    }
  })
}
