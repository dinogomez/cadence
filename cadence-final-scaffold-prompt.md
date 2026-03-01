# Cadence — Full Scaffold Spec
**AI-Powered Customer Support Training Platform**

---

## Overview

Build a full-stack voice training platform called **Cadence**. BPO agents practice against AI customers that dynamically escalate based on their actual responses. Agents receive real-time coaching flags and a detailed scorecard after each call.

The AI customer is voiced by ElevenLabs, transcription is handled by Voxtral, per-turn evaluation by Ministral 14B, and customer brain/scorecard by Mistral Large 3.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| Routing | React Router v6 |
| State | Zustand |
| Styling | Tailwind CSS v3 |
| UI Components | ElevenLabs UI (`@11labs/ui`) |
| Backend | Node.js + Hono (HTTP) + `ws` (WebSockets) |
| AI — STT | Voxtral via `@mistralai/mistralai` |
| AI — Customer brain | Mistral Large 3 via `@mistralai/mistralai` |
| AI — Turn eval | Ministral 14B via `@mistralai/mistralai` |
| AI — TTS | ElevenLabs v3 via `elevenlabs` npm SDK |
| Deployment | Railway (both frontend and backend as separate services) |

---

## Project Structure

```
cadence/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Practice.tsx
│   │   │   ├── Call.tsx
│   │   │   └── Assessment.tsx
│   │   ├── components/
│   │   │   ├── PersonaCard.tsx
│   │   │   ├── ScenarioCard.tsx
│   │   │   ├── ScoreBar.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   └── LiveFlag.tsx
│   │   ├── lib/
│   │   │   ├── store.ts          # Zustand global state
│   │   │   ├── socket.ts         # WebSocket client manager
│   │   │   ├── audio.ts          # AudioRecorder + playback utils
│   │   │   └── data.ts           # Personas + scenarios (shared definitions)
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── index.ts              # Hono app + ws server on shared http.Server
    │   ├── routes/
    │   │   └── session.ts        # POST /session/start
    │   ├── ws/
    │   │   └── callHandler.ts    # WebSocket turn loop
    │   ├── services/
    │   │   ├── llm.ts            # Mistral Large + Ministral calls
    │   │   ├── tts.ts            # ElevenLabs synthesis
    │   │   └── stt.ts            # Voxtral transcription
    │   └── data.ts               # Personas + scenarios (server-side with voiceIds)
    ├── package.json
    └── .env
```

---

## Environment Variables

### Backend `.env`
```env
MISTRAL_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ANGRY_MARK=        # ElevenLabs voice ID
ELEVENLABS_VOICE_LOLA_CARMEN=       # ElevenLabs voice ID
ELEVENLABS_VOICE_FIRM_ANDREA=       # ElevenLabs voice ID
ELEVENLABS_VOICE_FRUSTRATED_DEV=    # ElevenLabs voice ID
PORT=3001
```

### Frontend `.env`
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```

---

## Shared Data (`data.ts`)

Used in both frontend (UI rendering) and backend (system prompts).
**Frontend version omits `voiceId`** — never expose API keys to the client.

```typescript
// types.ts
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
  voiceTags: {
    default: string
    escalated: string
    calm: string
  }
  // Only on backend version:
  voiceId?: string
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

// Personas
export const PERSONAS: Persona[] = [
  {
    id: 'angry-mark',
    name: 'Angry Mark',
    age: 38,
    type: 'Frustrated Customer',
    description: 'Demanding refund outside policy window. Has been wronged and wants it fixed NOW.',
    traits: ['Interrupts frequently', 'Escalates on deflection', 'Responds to genuine empathy'],
    avatar: '😤',
    voiceTags: {
      default: '[frustrated]',
      escalated: '[angry] [speaking quickly]',
      calm: '[sighing] [calmer]',
    },
  },
  {
    id: 'lola-carmen',
    name: 'Lola Carmen',
    age: 72,
    type: 'Confused Elderly',
    description: "Tech-confused senior with a billing issue. Goes off-topic, repeats herself.",
    traits: ['Repeats questions', 'Needs patient guidance', 'Easily frustrated by jargon'],
    avatar: '👵',
    voiceTags: {
      default: '[speaking slowly] [confused]',
      escalated: '[worried] [trembling slightly]',
      calm: '[relieved] [speaking slowly]',
    },
  },
  {
    id: 'firm-andrea',
    name: 'Firm Andrea',
    age: 29,
    type: 'Cancellation Intent',
    description: "Wants to cancel, found a cheaper competitor. Open to staying but won't show it.",
    traits: ['Matter-of-fact', 'Dismisses generic offers', 'Responds to personalized value'],
    avatar: '💼',
    voiceTags: {
      default: '[firm] [matter-of-fact]',
      escalated: '[impatient] [clipped]',
      calm: '[considering] [warmer]',
    },
  },
  {
    id: 'frustrated-dev',
    name: 'Frustrated Dev',
    age: 31,
    type: 'Technical Support',
    description: 'Software issue, already tried everything, dismisses basic troubleshooting.',
    traits: ['Technically knowledgeable', 'Dismisses basic steps', 'Wants L2 escalation'],
    avatar: '💻',
    voiceTags: {
      default: '[frustrated] [curt]',
      escalated: '[exasperated]',
      calm: '[relieved]',
    },
  },
]

// Scenarios
export const SCENARIOS: Scenario[] = [
  {
    id: 'refund-outside-window',
    title: 'Refund Outside Policy Window',
    description: 'Customer purchased 45 days ago and demands a full refund. Policy allows 30 days.',
    difficulty: 'medium',
    context: 'Customer bought a laptop that had issues from day one. Tried to fix it himself for 2 weeks before calling.',
    policyFacts: [
      'Return window is 30 days from purchase date',
      'Customer purchased 45 days ago — outside window',
      'Exceptions require supervisor approval (agent cannot approve)',
      'Store credit can be offered as alternative',
      'Supervisor escalation must be documented before transfer',
    ],
    openingLine: "I need a refund and I need it NOW. I've been waiting 20 minutes just to get through.",
    estimatedTurns: 8,
    tags: ['Refunds', 'Policy', 'Escalation'],
  },
  {
    id: 'billing-confusion',
    title: 'Unexplained Billing Increase',
    description: "Customer received a higher bill and doesn't know why.",
    difficulty: 'easy',
    context: 'Promotional rate ended after 6 months. Email notification was sent 30 days ago.',
    policyFacts: [
      'Promotional rate ended after 6 months as per signup terms',
      'Email notification was sent 30 days prior to billing change',
      'Downgrade is possible but loses some features',
      'Pro-rata refund not available for current billing cycle',
      'Loyalty discount of up to 15% can be applied on request',
    ],
    openingLine: "Hello? I got my bill this month and it's way higher than usual. I really don't understand why.",
    estimatedTurns: 6,
    tags: ['Billing', 'Account'],
  },
  {
    id: 'cancellation-retention',
    title: 'Cancellation — Retention Call',
    description: 'Customer wants to cancel, citing a cheaper competitor.',
    difficulty: 'hard',
    context: 'Customer has been with us 18 months, high usage. Open to staying if offered the right deal but will not reveal this.',
    policyFacts: [
      'Agents can offer up to 20% loyalty discount (one-time use)',
      'Cannot match competitor pricing directly by name',
      'Can offer 1-month free trial of premium tier',
      'Cancellation is immediate with no partial refunds',
      'Win-back offers cannot be applied once customer cancels',
    ],
    openingLine: "Hi, I'd like to cancel my subscription please.",
    estimatedTurns: 10,
    tags: ['Retention', 'Churn', 'Sales'],
  },
  {
    id: 'tech-repeat-failure',
    title: 'Technical Support — Repeated Failure',
    description: "Customer has called 3 times for the same unresolved issue.",
    difficulty: 'hard',
    context: 'Ticket open for 2 weeks. Previous agents gave incorrect troubleshooting steps.',
    policyFacts: [
      'Issue requires Level 2 support — agent is Level 1',
      'L2 tickets can be marked urgent for 24hr SLA',
      '$10 account credit can be offered as compensation',
      'Agent cannot access previous call notes in current system',
      'Customer must be transferred, not put on hold',
    ],
    openingLine: "I'm calling AGAIN about the same issue. This is literally the third time.",
    estimatedTurns: 8,
    tags: ['Technical', 'Escalation', 'Repeat Contact'],
  },
]
```

---

## Backend

### `src/index.ts` — Shared HTTP + WebSocket server

```typescript
import { createServer } from 'http'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { WebSocketServer } from 'ws'
import sessionRoutes from './routes/session'
import { handleCallConnection } from './ws/callHandler'

const app = new Hono()
app.use('*', cors())
app.route('/api', sessionRoutes)

// Create shared http.Server so WS and Hono share the same port
const server = createServer()
serve({ fetch: app.fetch, overrideGlobalObjects: false }, (info) => {
  console.log(`Cadence backend running on port ${info.port}`)
})

// Attach WebSocket server to same http.Server
const wss = new WebSocketServer({ server })
wss.on('connection', handleCallConnection)

server.listen(process.env.PORT ?? 3001)
```

### `src/routes/session.ts` — Session start

```typescript
// POST /api/session/start
// Body: { scenarioId, personaId, agentName, customScenario? }
// Returns: { sessionId, openingLine, openingAudioB64 }

// 1. Look up persona (with voiceId) and scenario from server-side data
// 2. Generate opening audio with ElevenLabs using persona voiceId + default voiceTags
// 3. Return sessionId (crypto.randomUUID()), opening line text, opening audio as base64 string
```

### `src/ws/callHandler.ts` — WebSocket turn loop

Each message from client is a JSON string:
```typescript
// Client → Server
{
  type: 'turn',
  audioB64: string,          // base64 encoded webm audio
  history: { speaker: 'agent' | 'customer', text: string }[],
  escalationLevel: EscalationLevel,
  scenarioId: string,
  personaId: string,
  agentName: string,
  // OR for custom scenarios:
  customScenario?: { title, context, policyFacts }
}
```

Server → Client messages (send individually as JSON strings):
```typescript
{ type: 'agent_transcript', text: string, turn: number }
{ type: 'turn_evaluation', evaluation: TurnEvaluation, turn: number }
{ type: 'customer_response', text: string, audioB64: string, escalation: EscalationLevel, isEnd: boolean }
{ type: 'final_scorecard', scorecard: FinalScorecard }
{ type: 'error', message: string }
```

Turn processing order:
```
1. Receive audio bytes → Voxtral STT → agent transcript text
2. Send { type: 'agent_transcript' } immediately
3. Run in parallel with Promise.all():
   a. Ministral 14B → turn evaluation JSON
   b. Mistral Large 3 → customer response text + new escalation level
4. Send { type: 'turn_evaluation' } with eval results
5. ElevenLabs TTS → customer audio (use emotion tags based on new escalation)
6. Send { type: 'customer_response' } with audio + escalation + isEnd flag
7. If isEnd: Mistral Large 3 → final scorecard → send { type: 'final_scorecard' }
```

### `src/services/llm.ts`

```typescript
import Mistral from '@mistralai/mistralai'
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

// generateCustomerResponse(params) → { text: string, newEscalation: EscalationLevel, endCondition: string }
// Uses mistral-large-latest
// System prompt instructs persona to stay in character, respond to agent, escalate/de-escalate
// End response with:
//   ESCALATION_LEVEL: calm|frustrated|angry|very_angry
//   END_CONDITION: none|resolved|unresolved
// Parse these from the raw response before returning customerText

// evaluateTurn(params) → TurnEvaluation
// Uses ministral-14b-latest with response_format: json_object
// Returns scores 1.0–5.0 for empathy, english, compliance, resolution
// Returns flags array and one-line coaching_tip

// generateFinalScorecard(params) → FinalScorecard
// Uses mistral-large-latest with response_format: json_object
// Receives full transcript, scenario title, all turn evaluations
// Returns structured scorecard with strengths, improvements, training recommendations
```

**Customer Brain System Prompt template:**
```
You are {persona.name}, age {persona.age}. {persona.type}.
Backstory: {persona.description}
Current escalation level: {escalationLevel}

Escalation triggers (make you MORE upset): {persona.traits.join(', ')}
De-escalation triggers: genuine empathy, real solutions, taking ownership

Rules:
- Stay in character. Never acknowledge you are an AI.
- Respond ONLY to what the agent just said.
- Escalate if agent deflects, gives wrong policy info, or sounds robotic.
- De-escalate SLIGHTLY if agent leads with empathy and offers something real.
- Keep responses to 1–3 sentences. Real customers do not monologue.
- After your response, on a new line write:
  ESCALATION_LEVEL: calm|frustrated|angry|very_angry
  END_CONDITION: none|resolved|unresolved
```

**Turn Evaluator System Prompt:**
```
You are a BPO QA evaluator. Score the agent's single response.
Policy facts for this scenario: {policyFacts}

Return ONLY valid JSON:
{
  "score_empathy": <1.0–5.0>,
  "score_english": <1.0–5.0>,
  "score_compliance": <1.0–5.0>,
  "score_resolution": <1.0–5.0>,
  "flags": ["specific issue"],
  "coaching_tip": "one actionable sentence"
}

Rubric:
- empathy: Did agent acknowledge the customer's emotion BEFORE jumping to a solution?
- english: Grammar, clarity, vocabulary, no excessive filler words (uhm, like, you know)
- compliance: Accurate policy info, no unauthorized promises, correct procedure
- resolution: Moving toward solving the issue, taking ownership, not deflecting
```

### `src/services/tts.ts`

```typescript
import { ElevenLabsClient } from 'elevenlabs'
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

// synthesize(text, voiceId, escalationLevel) → Buffer (mp3)
// Prepend emotion tags based on escalation:
//   calm       → '[warm] [speaking slowly]'
//   frustrated → '[frustrated]'
//   angry      → '[angry] [speaking quickly]'
//   very_angry → '[shouting] [angry]'
// Model: eleven_multilingual_v3
// voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true }
// output_format: mp3_44100_128
// Collect stream into Buffer, return as base64 string
```

### `src/services/stt.ts`

```typescript
// transcribe(audioB64: string) → string
// Decode base64 to Buffer
// Create File object with type 'audio/webm'
// Call mistral.audio.transcriptions.create({ model: 'voxtral-mini-latest', file })
// Return transcription.text
```

---

## Frontend

### `src/lib/store.ts` — Zustand

```typescript
interface AppState {
  // Setup (persists across call → assessment)
  selectedPersona: Persona | null
  selectedScenario: Scenario | null
  agentName: string
  customScenario: Partial<Scenario> | null
  sessionId: string | null
  openingAudioB64: string | null

  // Call state
  escalationLevel: EscalationLevel
  agentState: AgentState           // drives the Orb: null | 'listening' | 'thinking' | 'talking'
  turns: { speaker: 'agent' | 'customer'; text: string }[]
  liveFlags: { turn: number; type: 'warning' | 'success' | 'info'; message: string }[]
  isRecording: boolean
  isSpeaking: boolean

  // Assessment
  scorecard: FinalScorecard | null

  // Actions
  setPersona, setScenario, setAgentName, setCustomScenario,
  setSessionId, setOpeningAudio,
  setEscalation, setAgentState,
  addTurn, addFlag,
  setRecording, setSpeaking,
  setScorecard,
  reset
}
```

### `src/lib/socket.ts` — WebSocket client

```typescript
// CadenceSocket class
// connect(url, onMessage, onClose) → void
// sendTurn(payload) → void  — sends JSON string
// close() → void
// 
// onMessage dispatches to store actions:
//   agent_transcript → addTurn({ speaker: 'agent', text })
//   turn_evaluation  → addFlag(s) based on flags + score
//   customer_response → addTurn({ speaker: 'customer', text })
//                        setEscalation, setSpeaking(true)
//                        playAudio(audioB64).then(() => setSpeaking(false))
//                        if isEnd: setAgentState(null)
//   final_scorecard  → setScorecard, navigate to /assessment/:sessionId
```

### `src/lib/audio.ts` — AudioRecorder + playback

```typescript
// AudioRecorder class
//   init() → Promise<void>   — getUserMedia with echoCancellation + noiseSuppression
//   start() → void           — starts MediaRecorder (prefer audio/webm;codecs=opus)
//   stop() → Promise<string> — stops recording, returns base64 string
//   getAnalyser() → AnalyserNode  — for Orb audio reactivity while recording
//   getOutputAnalyser(audioElement) → AnalyserNode  — for Orb reactivity during playback
//   destroy() → void

// playAudioFromBase64(b64: string) → Promise<void>
//   Decode base64 → Uint8Array → Blob → Object URL → Audio element
//   Resolve on 'ended' event, revoke object URL after
```

---

## Pages

### Page 1 — Landing (`/`)

Clean white SaaS landing page. Minimal, content-first. Matches the Bluejay reference aesthetic.

- **Nav:** Sticky white nav, `border-b border-gray-200`. Left: "Cadence" wordmark (`font-semibold text-gray-900`). Center: nav links (Product, How it works, Scenarios) in `text-sm text-gray-500`. Right: "Login" (ghost button) + "Start Practice" (blue primary button).
- **Social proof row (below nav):** Two small badges side by side — "Built for Mistral Hackathon 2026" and "Powered by ElevenLabs Voxtral" — gray pill style, `bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full`.
- **Hero:** Left-aligned, not centered. Large headline `text-5xl font-semibold text-gray-900 leading-tight` — "Practice every call.\nScore what matters." Subtext `text-lg text-gray-500 mt-4 max-w-lg` — "AI customers that escalate based on how you respond. Real-time coaching. Detailed scorecards built for BPO agents." Primary CTA: "Start Practicing →" blue button. Secondary: "See how it works" text link.
- **Dashboard preview:** Below hero, a bordered screenshot-style mockup (`border border-gray-200 rounded-xl shadow-sm overflow-hidden`) showing the call page UI — like Bluejay shows its results dashboard. This is just a static representation of the call and assessment layout.
- **Features section:** 3-column grid of minimal feature cards — white background, light gray border, icon + title + one-line description. Features: Real-time escalation / Per-turn evaluation / Detailed scorecards.
- **Footer:** `border-t border-gray-200 bg-white`. "Cadence · Built for Mistral Hackathon 2026" left. "Mistral · Voxtral · ElevenLabs" right. All `text-sm text-gray-400`.

### Page 2 — Practice Setup (`/practice`)

White page, `bg-gray-50` body. Centered content `max-w-3xl mx-auto px-6 py-10`.

Step indicator at top: numbered circles connected by a thin gray line. Active: `bg-blue-600 text-white rounded-full`. Done: `bg-blue-50 text-blue-600 border border-blue-200 rounded-full`. Inactive: `bg-white border border-gray-300 text-gray-400 rounded-full`. Step labels below each circle in `text-xs text-gray-500`.

**Step 1 — Select Persona**
Section heading + subtitle. 2x2 grid of `PersonaCard`. Card: `bg-white border border-gray-200 rounded-lg p-4`. Selected: `border-blue-600 ring-1 ring-blue-600`. Hover: `hover:shadow-sm hover:border-gray-300`. Checkmark top-right when selected in `text-blue-600`. Content: large emoji, name (`font-semibold text-gray-900`), type badge (colored pill), description (`text-sm text-gray-500`), trait tags (`text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded`). "Next →" right-aligned blue button, disabled until selected.

**Step 2 — Build Scenario**
Segmented control: `bg-gray-100 rounded-lg p-1` with active tab as `bg-white rounded-md shadow-sm text-gray-900 font-medium`. Tabs: "Pre-built" / "Custom".
Pre-built: 2x2 grid of `ScenarioCard` — same selection treatment. Shows title, difficulty badge (easy=`bg-green-50 text-green-700`, medium=`bg-yellow-50 text-yellow-700`, hard=`bg-red-50 text-red-700`), description, tags, estimated turns.
Custom: white card with labeled inputs for title, context, policy facts textarea.

**Step 3 — Confirm & Start**
Two horizontal summary cards (persona + scenario), each `bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3` with a small blue "Change" link. Agent name input below. 4 scoring dimension pills in a row (`bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-1`). "Start Call →" full-width blue primary button. On click: POST `/api/session/start`, store sessionId + openingAudioB64, navigate to `/call/:sessionId`.

### Page 3 — Active Call (`/call/:sessionId`)

Full viewport height, no scroll. White background. Two-panel layout with a `border-r border-gray-200` divider.

**Top bar:** `border-b border-gray-200 bg-white h-14 px-6 flex items-center justify-between`. Left: red dot (`bg-red-500 w-2 h-2 rounded-full animate-pulse`) + "Live Call" `text-sm font-medium text-gray-900`. Center: scenario name `text-sm text-gray-500`. Right: escalation badge (pill, color changes with level) + turn counter `text-sm text-gray-400`.

**On mount:**
- Connect WebSocket to `VITE_WS_URL/call/:sessionId`
- Play opening audio from `openingAudioB64` in store
- Set `agentState = 'talking'` while audio plays, then `null`

**Left panel (call area) — ~60% width:**

Customer header: `border-b border-gray-100 px-6 py-4 bg-white flex items-center gap-3`. Avatar emoji in `w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl`. Name `font-medium text-gray-900`, type + scenario `text-sm text-gray-500`. Speaking indicator: 3 animated gray dots when `isSpeaking`.

Orb — centered in a white area, `bg-white flex items-center justify-center py-8`:
```tsx
const ORB_COLORS: Record<EscalationLevel, [string, string]> = {
  calm:       ['#CADCFC', '#A0B9D1'],  // blue — customer is calm
  frustrated: ['#FDE68A', '#D97706'],  // amber
  angry:      ['#FCA5A5', '#DC2626'],  // red
  very_angry: ['#F87171', '#991B1B'],  // deep red
}

<Orb
  colors={ORB_COLORS[escalationLevel]}
  agentState={agentState}
  getInputVolume={getInputVolume}
  getOutputVolume={getOutputVolume}
  className="w-40 h-40"
/>
```

Conversation panel: `flex-1 overflow-hidden border-t border-gray-100`
```tsx
<Conversation>
  <ConversationContent>
    {turns.length === 0
      ? <ConversationEmptyState icon={<Orb className="w-8 h-8" />} title="Call in progress" description="Hold Space to speak" />
      : turns.map(...) // Message components
    }
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```
Customer messages: `from="assistant"` — left-aligned, `bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm`.
Agent messages: `from="user"` — right-aligned, `bg-blue-600 text-white rounded-2xl rounded-tr-sm`.

Recording button: `border-t border-gray-200 bg-white px-6 py-4`.
- Default: gray outline button, full width — "Hold to Speak · Space"
- Recording: `bg-red-600 text-white animate-record-pulse` — "Recording... release to send"
- Thinking: spinner + "Processing..." disabled
- Disabled while `isSpeaking` or `agentState === 'thinking'`

**Right panel (live coaching) — ~40% width, `bg-gray-50`:**

Escalation section: `px-4 py-4 border-b border-gray-200`.
Label `text-xs font-medium text-gray-500 uppercase tracking-wide mb-2`. Colored pill badge (calm=`bg-green-50 text-green-700`, frustrated=`bg-yellow-50 text-yellow-700`, angry=`bg-orange-50 text-orange-700`, very_angry=`bg-red-50 text-red-700`). Thin progress bar below with matching color.

Turn progress: `px-4 py-3 border-b border-gray-200`. Row of thin `h-1 rounded-full` bars, gray unfilled, `bg-blue-600` filled.

Live coaching feed: `px-4 py-4 flex-1 overflow-y-auto`. Title `text-xs font-medium text-gray-500 uppercase tracking-wide mb-3`. Each flag: small card `bg-white border border-gray-200 rounded-lg p-3 text-sm animate-slide-up mb-2`. Warning: left border `border-l-2 border-l-red-400`. Success: `border-l-2 border-l-green-500`. Tip: `border-l-2 border-l-blue-400`. Icon + message text.

Score preview: `px-4 py-4 border-t border-gray-200 bg-white`. 4 rows, each `flex items-center gap-2 mb-2`. Label `text-xs text-gray-500 w-24`. Thin bar `flex-1 h-1.5 bg-gray-200 rounded-full` with filled portion `bg-blue-600 rounded-full`. Score `text-xs text-gray-400`.

### Page 4 — Assessment (`/assessment/:sessionId`)

White page. Read `scorecard` from Zustand — redirect to `/practice` if null.

**Top bar:** same nav. Back link "← New Session" left, "Practice Again" blue button right.

**Hero:** `max-w-3xl mx-auto px-6 pt-10 pb-6 border-b border-gray-100`. Flex row: left has agent name `text-xl font-semibold text-gray-900`, scenario `text-sm text-gray-500 mt-1`, outcome badge pill. Right has `ScoreRing` + overall score `text-4xl font-semibold text-gray-900` + "/ 5.0" `text-xl text-gray-400`.

**Metric row (Bluejay-style):** `bg-gray-50 border-y border-gray-200`.
4 boxes in a row, vertical dividers between. Each: dimension name `text-xs font-medium text-gray-500 uppercase tracking-wide`, large score `text-3xl font-semibold text-gray-900`, color indicator dot. Full width, `max-w-3xl mx-auto px-6 py-6`.

**Score bars:** `max-w-3xl mx-auto px-6 py-6 border-b border-gray-100`. 4 `ScoreBar` rows staggered 100ms each.

**Content sections:** `max-w-3xl mx-auto px-6 py-6 grid grid-cols-1 gap-8 border-b border-gray-100`.
Each section heading: `text-sm font-semibold text-gray-900 mb-3`. Items: plain list, `text-sm text-gray-600 py-1.5 border-b border-gray-100 last:border-0`. Left-colored dot: green for strengths, yellow for improvements, blue for training.

**Turn table:** `max-w-3xl mx-auto px-6 pb-12`.
Heading `text-sm font-semibold text-gray-900 mb-4`. Standard table: `w-full`. `thead` with `text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 border-b border-gray-200`. Columns: Turn / Agent Response / Empathy / English / Compliance / Resolution / Coaching Tip. Rows `border-b border-gray-100 text-sm`. Score cells: small colored pill badges. Coaching tip: `text-gray-500 text-xs`. Agent response truncated with `truncate max-w-xs` — expand on row click.

---

## UI Components

### `ScoreRing.tsx`
```tsx
// Animated SVG circle ring
// Props: score (0–5), size (default 96)
// stroke-dasharray = circumference
// stroke-dashoffset animates on mount from circumference → circumference * (1 - score/5)
// Color: text-green-600 ≥4, text-yellow-500 ≥3, text-orange-500 ≥2, text-red-600 <2
// Track circle: stroke="#e5e7eb"
// Score number centered inside: font-semibold text-gray-900
```

### `ScoreBar.tsx`
```tsx
// Labeled horizontal progress bar
// Props: label (string), score (0–5), delay (number, ms for stagger)
// Layout: flex row — label text-sm text-gray-600 w-28, bar flex-1, score text-sm font-medium text-gray-900 w-8 text-right
// Bar: h-2 bg-gray-200 rounded-full; inner div animates width on mount with transitionDelay
// Color: bg-green-500 ≥4, bg-yellow-400 ≥3, bg-orange-400 ≥2, bg-red-500 <2
```

### `PersonaCard.tsx`
```tsx
// Clickable card
// Props: persona, selected, onSelect
// Base: bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors
// Hover: hover:border-gray-300 hover:shadow-sm
// Selected: border-blue-600 ring-1 ring-blue-600
// Checkmark: absolute top-3 right-3, text-blue-600, only shown when selected
// Content: emoji in bg-gray-100 rounded-full w-10 h-10, name font-semibold, type badge colored pill, description text-sm text-gray-500, trait tags text-xs bg-gray-100 rounded px-2 py-0.5
```

### `ScenarioCard.tsx`
```tsx
// Clickable card — same base styles as PersonaCard
// Content: title font-semibold, difficulty badge (easy=bg-green-50 text-green-700, medium=bg-yellow-50 text-yellow-700, hard=bg-red-50 text-red-700), description text-sm text-gray-500, tags row text-xs text-gray-400, turns text-xs text-gray-400 right-aligned
```

---

## Design System

Reference aesthetic: clean white SaaS product (see Bluejay, Linear, Vercel). Minimal, high contrast, content-first. No dark backgrounds, no gradients, no decorative noise textures.

### Colors
```css
/* Backgrounds */
--bg:         #ffffff   /* page background */
--surface:    #f9fafb   /* card / panel background (gray-50) */
--surface-2:  #f3f4f6   /* subtle inset surface (gray-100) */

/* Borders */
--border:     #e5e7eb   /* default border (gray-200) */
--border-strong: #d1d5db /* stronger border (gray-300) */

/* Text */
--text-primary:   #111827  /* gray-900 — headings */
--text-secondary: #6b7280  /* gray-500 — subtext, labels */
--text-tertiary:  #9ca3af  /* gray-400 — placeholder, muted */

/* Accent — use sparingly */
--blue:       #2563eb   /* blue-600 — primary CTA, links */
--blue-light: #eff6ff   /* blue-50  — badge backgrounds */

/* Status */
--green:      #16a34a   /* green-600 */
--green-bg:   #f0fdf4   /* green-50  */
--red:        #dc2626   /* red-600   */
--red-bg:     #fef2f2   /* red-50    */
--yellow:     #ca8a04   /* yellow-600 */
--yellow-bg:  #fefce8   /* yellow-50  */
```

### Typography
Single font: **Inter** — load from Google Fonts.
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

All text uses Inter at different weights:
- `font-semibold` (600) — headings, card titles, CTA labels
- `font-medium` (500) — subheadings, nav items, badges
- `font-normal` (400) — body text, descriptions
- No special display font. No monospace labels. Inter only.

### Tailwind Config
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    keyframes: {
      slideUp: {
        from: { opacity: '0', transform: 'translateY(8px)' },
        to:   { opacity: '1', transform: 'translateY(0)' },
      },
      recordPulse: {
        '0%,100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.3)' },
        '50%':     { boxShadow: '0 0 0 8px rgba(220,38,38,0)' },
      },
    },
    animation: {
      'slide-up':     'slideUp 0.25s ease forwards',
      'record-pulse': 'recordPulse 1.5s ease-in-out infinite',
    },
  },
}
```

### Component Conventions

**Cards:** `bg-white border border-gray-200 rounded-lg` — flat, no shadow by default. Hover: `hover:border-gray-300 hover:shadow-sm`. Selected: `border-blue-600 ring-1 ring-blue-600`.

**Buttons:**
- Primary: `bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700`
- Secondary: `bg-white text-gray-700 border border-gray-300 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50`
- Ghost: `text-gray-500 text-sm hover:text-gray-900`

**Badges:** `text-xs font-medium px-2 py-0.5 rounded-full` — e.g. difficulty easy: `bg-green-50 text-green-700`, medium: `bg-yellow-50 text-yellow-700`, hard: `bg-red-50 text-red-700`

**Inputs:** `border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`

**Nav:** `border-b border-gray-200 bg-white` — sticky, white background, 64px height.

**Page max-width:** `max-w-5xl mx-auto px-6` for all page content.

**Dividers:** `border-t border-gray-100` — very subtle.

Visual details:
- White background on everything. No dark surfaces.
- Shadows only on hover or interactive lift: `shadow-sm` max.
- Status badges match the Bluejay reference: pill shape, colored text on light tinted background.
- All transitions: `transition-colors duration-150` — snappy, not slow.
- No gradients, no glow effects, no noise textures.

---

## ElevenLabs UI Installation

```bash
# Install the package
npm install @11labs/ui

# Add required components via CLI
npx @elevenlabs/cli@latest components add orb
npx @elevenlabs/cli@latest components add conversation
npx @elevenlabs/cli@latest components add message
```

This copies component source files into `src/components/ui/`. Import from there:
```typescript
import { Orb } from '@/components/ui/orb'
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ui/conversation'
import { Message, MessageContent } from '@/components/ui/message'
```

The Orb requires Three.js and React Three Fiber — these are installed automatically as peer dependencies.

---

## package.json

### Frontend
```json
{
  "name": "cadence-frontend",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.3",
    "clsx": "^2.1.1",
    "@11labs/ui": "latest"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "typescript": "^5.7.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### Backend
```json
{
  "name": "cadence-backend",
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "ws": "^8.18.0",
    "@mistralai/mistralai": "^1.3.6",
    "elevenlabs": "^1.9.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/ws": "^8.5.13",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Railway Deployment

Two Railway services from the same GitHub repo:

**Service 1 — Backend**
- Root directory: `backend/`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Port: `3001` (or `$PORT`)
- Add all env vars from backend `.env`

**Service 2 — Frontend**
- Root directory: `frontend/`
- Build command: `npm install && npm run build`
- Start command: `npx serve dist` (or Railway static site)
- Environment variable: `VITE_WS_URL=wss://your-backend.railway.app` and `VITE_API_URL=https://your-backend.railway.app`

---

## Critical Notes for the Coding Agent

1. **Hono + ws on same port.** Pass the `http.Server` instance to both `@hono/node-server` and `new WebSocketServer({ server })`. They share one port. Do not run them on separate ports.

2. **Audio format.** Use `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')` before creating the recorder. Voxtral accepts `audio/webm`. Do not convert to WAV.

3. **Promise.all for parallel AI calls.** Run Ministral 14B evaluation and Mistral Large customer response generation in parallel — this halves turn latency. Do not await them sequentially.

4. **Orb audio reactivity.** Create an `AnalyserNode` from the MediaStream source before recording starts. While `agentState === 'listening'`, pass `getInputVolume` to the Orb. While customer audio is playing, connect the Audio element to a Web Audio context and pass `getOutputVolume` to the Orb.

5. **Orb colors via ref.** Use `colorsRef` (RefObject) instead of `colors` prop if you want smooth color transitions when escalation level changes, to avoid re-mounting the Three.js canvas.

6. **Client owns history.** The backend is fully stateless. The client sends the full `turns` array with every WebSocket message. The server never stores conversation state between turns.

7. **Opening audio timing.** After `POST /api/session/start` returns, store `openingAudioB64` in Zustand. In the Call page `useEffect`, play it on mount and set `agentState = 'talking'` during playback, then `null` when done.

8. **Space bar shortcut scoping.** Add the `keydown`/`keyup` listeners in a `useEffect` with proper cleanup. Guard against firing when a text input is focused (`e.target` check).

9. **Assessment redirect.** If the user navigates directly to `/assessment/:id` with no scorecard in the store, redirect to `/practice` immediately.

10. **ElevenLabs UI peer deps.** The Orb component needs `three`, `@react-three/fiber`, and `@react-three/drei`. The CLI install handles this but verify they're in `node_modules` before running.
