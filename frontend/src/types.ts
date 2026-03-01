export type Difficulty = 'easy' | 'medium' | 'hard'
export type EscalationLevel = 'calm' | 'frustrated' | 'angry' | 'very_angry'
export type AgentState = null | 'listening' | 'thinking' | 'talking'

export interface Persona {
  id: string
  name: string
  age: number
  type: string
  description: string
  traits: string[]
  avatar: string
  voiceTags: { default: string; escalated: string; calm: string }
}

export interface Scenario {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  context: string
  policyFacts: string[]
  openingLine: string
  estimatedTurns: number
  tags: string[]
}

export interface TurnEvaluation {
  turnNumber: number
  agentText: string
  scoreEmpathy: number
  scoreEnglish: number
  scoreCompliance: number
  scoreResolution: number
  flags: string[]
  coachingTip: string
}

export interface FinalScorecard {
  overallScore: number
  scoreEmpathy: number
  scoreEnglish: number
  scoreCompliance: number
  scoreResolution: number
  outcome: 'resolved' | 'unresolved' | 'escalated'
  strengths: string[]
  areasForImprovement: string[]
  recommendedTraining: string[]
  scenarioTitle: string
  agentName: string
}
