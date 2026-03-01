import { create } from 'zustand'
import type { Persona, Scenario, AgentState, EscalationLevel, TurnEvaluation, FinalScorecard } from '@/types'

interface AppState {
  selectedPersona: Persona | null
  selectedScenario: Scenario | null
  agentName: string
  customScenario: (Partial<Scenario> & { personaNameOverride?: string; personaTypeOverride?: string }) | null
  sessionId: string | null
  voiceId: string | null
  openingAudioB64: string | null
  openingLine: string | null
  callMode: 'customer-first' | 'agent-first'
  customerName: string | null
  callDetails: { summary: string; situation: string; companyName: string; policyFacts: string[]; details: { label: string; value: string }[] } | null

  escalationLevel: EscalationLevel
  agentState: AgentState
  turns: { speaker: 'agent' | 'customer'; text: string }[]
  liveFlags: { turn: number; type: 'warning' | 'success' | 'info'; message: string }[]
  turnEvaluations: TurnEvaluation[]
  isRecording: boolean
  isSpeaking: boolean

  scorecard: FinalScorecard | null
  scorecardLoading: boolean
  lastPreviewKey: string

  setPersona: (p: Persona | null) => void
  setScenario: (s: Scenario | null) => void
  setAgentName: (name: string) => void
  setCustomScenario: (s: (Partial<Scenario> & { personaNameOverride?: string; personaTypeOverride?: string }) | null) => void
  setSessionId: (id: string) => void
  setVoiceId: (id: string | null) => void
  setOpeningAudio: (b64: string) => void
  setOpeningLine: (line: string) => void
  setCallMode: (mode: 'customer-first' | 'agent-first') => void
  setCustomerName: (name: string | null) => void
  setCallDetails: (d: { summary: string; situation: string; companyName: string; policyFacts: string[]; details: { label: string; value: string }[] } | null) => void
  setEscalation: (l: EscalationLevel) => void
  setAgentState: (s: AgentState) => void
  addTurn: (t: { speaker: 'agent' | 'customer'; text: string }) => void
  addFlag: (f: { turn: number; type: 'warning' | 'success' | 'info'; message: string }) => void
  addTurnEvaluation: (e: TurnEvaluation) => void
  setRecording: (v: boolean) => void
  setSpeaking: (v: boolean) => void
  setScorecard: (s: FinalScorecard) => void
  setScorecardLoading: (v: boolean) => void
  setLastPreviewKey: (k: string) => void
  reset: () => void
}

const initialState = {
  selectedPersona: null, selectedScenario: null, agentName: '',
  customScenario: null, sessionId: null, voiceId: null, openingAudioB64: null, openingLine: null, callMode: 'customer-first' as const, customerName: null, callDetails: null,
  escalationLevel: 'calm' as EscalationLevel, agentState: null as AgentState,
  turns: [], liveFlags: [], turnEvaluations: [],
  isRecording: false, isSpeaking: false, scorecard: null, scorecardLoading: false, lastPreviewKey: '',
}

export const useStore = create<AppState>((set) => ({
  ...initialState,
  setPersona: (p) => set({ selectedPersona: p }),
  setScenario: (s) => set({ selectedScenario: s }),
  setAgentName: (name) => set({ agentName: name }),
  setCustomScenario: (s) => set({ customScenario: s }),
  setSessionId: (id) => set({ sessionId: id }),
  setVoiceId: (id) => set({ voiceId: id }),
  setOpeningAudio: (b64) => set({ openingAudioB64: b64 }),
  setOpeningLine: (line) => set({ openingLine: line }),
  setCallMode: (mode) => set({ callMode: mode }),
  setCustomerName: (name) => set({ customerName: name }),
  setCallDetails: (d) => set({ callDetails: d }),
  setEscalation: (l) => set({ escalationLevel: l }),
  setAgentState: (s) => set({ agentState: s }),
  addTurn: (t) => set((state) => ({ turns: [...state.turns, t] })),
  addFlag: (f) => set((state) => ({ liveFlags: [...state.liveFlags, f] })),
  addTurnEvaluation: (e) => set((state) => ({ turnEvaluations: [...state.turnEvaluations, e] })),
  setRecording: (v) => set({ isRecording: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setScorecard: (s) => set({ scorecard: s }),
  setScorecardLoading: (v) => set({ scorecardLoading: v }),
  setLastPreviewKey: (k) => set({ lastPreviewKey: k }),
  reset: () => set({ ...initialState }),
}))
