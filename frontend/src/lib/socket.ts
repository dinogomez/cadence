import { useStore } from '@/lib/store'
import { playAudioFromBase64 } from '@/lib/audio'
import type { TurnEvaluation, FinalScorecard } from '@/types'

let navigateFn: ((path: string) => void) | null = null
export function setNavigate(fn: (path: string) => void) { navigateFn = fn }

let activeSocket: CadenceSocket | null = null

const stripMd = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1')
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

interface SocketCallbacks {
  onOpen?: () => void
  onError?: () => void
  onClose?: () => void
}

export class CadenceSocket {
  private ws: WebSocket | null = null

  connect(url: string, callbacks?: SocketCallbacks): void {
    activeSocket = this
    this.ws = new WebSocket(url)

    this.ws.onopen = () => callbacks?.onOpen?.()
    this.ws.onerror = () => callbacks?.onError?.()
    this.ws.onclose = () => callbacks?.onClose?.()

    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      const store = useStore.getState()

      if (msg.type === 'agent_transcript') {
        store.addTurn({ speaker: 'agent', text: stripMd(msg.text) })
        store.setAgentState('thinking')
      }

      if (msg.type === 'turn_evaluation') {
        const eval_: TurnEvaluation = msg.evaluation
        store.addTurnEvaluation(eval_)

        // Add coaching flags
        if (eval_.coachingTip) {
          store.addFlag({ turn: msg.turn, type: 'info', message: capitalize(eval_.coachingTip) })
        }
        eval_.flags.forEach((f: string) => {
          store.addFlag({ turn: msg.turn, type: 'warning', message: capitalize(f) })
        })
        // Success flag if all scores >= 4
        const avg = (eval_.scoreEmpathy + eval_.scoreEnglish + eval_.scoreCompliance + eval_.scoreResolution) / 4
        if (avg >= 4) {
          store.addFlag({ turn: msg.turn, type: 'success', message: 'Great turn! High scores across all dimensions.' })
        }
      }

      if (msg.type === 'customer_response') {
        store.addTurn({ speaker: 'customer', text: stripMd(msg.text) })
        store.setEscalation(msg.escalation)
        store.setAgentState('talking')
        store.setSpeaking(true)
        if (msg.isEnd) {
          // Signal ending before audio plays so UI updates immediately
          store.setCallEnding(msg.endCondition ?? 'resolved')
        }

        await playAudioFromBase64(msg.audioB64)

        store.setSpeaking(false)
        store.setAgentState(null)
        if (msg.isEnd) {
          store.setScorecardLoading(true)
          const sessionId = store.sessionId
          if (navigateFn && sessionId) navigateFn(`/assessment/${sessionId}`)
        }
      }

      if (msg.type === 'final_scorecard') {
        store.setScorecardLoading(false)
        if (msg.scorecard) {
          store.setScorecard(msg.scorecard as FinalScorecard)
        }
        // Close socket now that we're done — it may have been kept alive across navigation
        activeSocket?.close()
        activeSocket = null
      }

      if (msg.type === 'error') {
        console.error('Server error:', msg.message)
        store.setAgentState(null)
      }
    }

  }

  sendTurn(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  sendEndCall(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_call', ...payload }))
    }
  }

  close(): void {
    this.ws?.close()
    this.ws = null
  }
}
