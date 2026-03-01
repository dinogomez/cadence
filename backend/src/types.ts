export type EscalationLevel = 'calm' | 'frustrated' | 'angry' | 'very_angry'

export interface TurnEvaluation {
  turnNumber: number; agentText: string
  scoreEmpathy: number; scoreEnglish: number
  scoreCompliance: number; scoreResolution: number
  flags: string[]; coachingTip: string
}

export interface FinalScorecard {
  overallScore: number; scoreEmpathy: number; scoreEnglish: number
  scoreCompliance: number; scoreResolution: number
  outcome: 'resolved' | 'unresolved' | 'escalated'
  strengths: string[]; areasForImprovement: string[]
  recommendedTraining: string[]; scenarioTitle: string; agentName: string
}
