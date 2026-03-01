import { Mistral } from '@mistralai/mistralai'
import type { EscalationLevel, TurnEvaluation, FinalScorecard } from '../types.js'
import type { Persona, Scenario } from '../data.js'

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

interface Turn { speaker: 'agent' | 'customer'; text: string }

export interface CallDetails {
  summary: string          // 1-sentence plain English summary of the customer's problem
  situation: string        // customer-specific context sentence (replaces static template context)
  companyName: string      // name of the company the agent is representing
  policyFacts: string[]    // scenario policy rules reworded to reference this specific company
  details: { label: string; value: string }[]  // account #, order #, dates, amounts etc
}

export async function generateOpeningLine(params: {
  persona: Persona
  scenario: { title: string; context: string; policyFacts: string[] } | Scenario
  callDetails?: { summary: string; details: { label: string; value: string }[] } | null
}): Promise<string> {
  const { persona, scenario, callDetails } = params
  const detailsBlock = callDetails
    ? `\nYour specific situation: ${callDetails.summary}\nKey details to reference naturally: ${callDetails.details.map(d => `${d.label}: ${d.value}`).join(', ')}`
    : ''
  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [
      {
        role: 'system',
        content: `You are ${persona.name}, age ${persona.age}. ${persona.type}.
Backstory: ${persona.description}
Scenario context: ${scenario.context}${detailsBlock}

HOW YOU SPEAK:
${persona.speechStyle}

Generate a single opening line — the very first thing you say when a call center agent picks up.
You may reference a specific detail (order number, item name, etc) but do so naturally and imperfectly — the way a real person would, not a database readout.
Keep it 1–3 sentences, in character, emotionally authentic. Vary the phrasing each time — never use a fixed template.
Return ONLY the spoken line, no quotes, no labels.`,
      },
      { role: 'user', content: 'Generate the opening line.' },
    ],
    maxTokens: 120,
  })
  const raw = response.choices?.[0]?.message?.content ?? ''
  const rawStr = typeof raw === 'string' ? raw : raw.map((b) => ('text' in b ? (b as { text: string }).text : '')).join('')
  return rawStr.trim()
}

export async function generateCustomerName(persona: Persona): Promise<string> {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 999983)}`
  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [{
      role: 'user',
      content: `Generate a realistic full name for a customer. Random seed: ${seed}
${persona.voiceAccent
  ? `The customer's voice has a ${persona.voiceAccent} accent. The name MUST be culturally authentic to ${persona.voiceAccent} culture/region. DO NOT generate an Anglo-Saxon, English, or American name.`
  : `Name locale/origin: ${persona.nameLocale}`}
Voice gender: ${persona.voiceGender} — the name MUST be a ${persona.voiceGender} name, no exceptions.

Rules:
- The name must feel completely authentic to the locale/accent above — not Anglo-Saxon unless the accent is American, British, or Australian.
- Vary widely — do not default to common or overused names.
- Do NOT use: Ethan, Cole, Whitmore, Ananya, Emma, James, John, Michael, Sarah, or any name that does not match the accent/locale.
- Return ONLY the full name, nothing else. No quotes, no labels, no punctuation after.`
    }],
    maxTokens: 20,
  })
  const raw = response.choices?.[0]?.message?.content ?? ''
  const rawStr = typeof raw === 'string' ? raw : raw.map((b) => ('text' in b ? (b as { text: string }).text : '')).join('')
  return rawStr.trim()
}

export async function generateCallDetails(params: {
  customerName: string
  scenario: Scenario | { title: string; context: string; policyFacts: string[] }
  nameLocale?: string
}): Promise<CallDetails> {
  const { customerName, scenario, nameLocale } = params
  const seed = Math.floor(Math.random() * 999983)
  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [{
      role: 'user',
      content: `You are generating a realistic call scenario briefing for a BPO agent training simulation.
Variation seed: ${seed} — use this to ensure variety across generations.

Customer name: ${customerName}${nameLocale ? `\nCustomer name locale: ${nameLocale} — this is already set, do NOT invent or substitute a different name` : ''}
Scenario: ${'title' in scenario ? scenario.title : 'Custom'}
Context: ${scenario.context}
Policy facts: ${scenario.policyFacts.join(' | ')}

Generate:
1. A one-sentence agent-facing summary of the customer's problem (plain, factual — for the agent's eyes only)
2. A one-sentence backstory for why ${customerName} is calling today. Must use the name ${customerName} — do NOT invent or substitute a different name. Vary the reason widely — everyday purchases, work needs, personal use, home appliances, subscriptions, travel, etc. Do NOT use birthday gifts, anniversary gifts, or holiday gifts. Do NOT copy the scenario context verbatim.
3. A realistic company name the agent is working for (e.g. "NovaTech Solutions", "Apex Retail", "BlueWave Telecom" — fitting the scenario type, never a real company)
4. Pick the 3 most important policy facts and rewrite them as short plain-English rules. Write them generically — do NOT mention the company name, product names, or any branding. Use neutral phrasing like "Agents may offer...", "The return window is...", "Exceptions require supervisor approval." Keep them short: one sentence each, no markdown, no bold, no asterisks.
5. 3–5 specific fake-but-realistic details the customer would reference. Pick only labels relevant to this scenario type — do NOT invent a product if the scenario is about billing, subscriptions, or account access. For retail/shipping scenarios, invent a product consistent with the scenario description (not always electronics or a TV). Use variety.

Source policy facts:
${scenario.policyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Return ONLY valid JSON:
{
  "summary": "one sentence describing the problem",
  "situation": "one sentence specific backstory for this customer",
  "company_name": "Company Name Inc",
  "policy_facts": ["Agents may offer a loyalty discount of up to 15% on request.", "The return window is 30 days from purchase date.", "Exceptions require supervisor approval."],
  "details": [
    { "label": "Account Number", "value": "ACC-XXXXXX" },
    { "label": "Order Number", "value": "ORD-XXXXXX" }
  ]
}

Make numbers realistic (account numbers 8 digits, order numbers like ORD-28491, dates in Month DD YYYY format, dollar amounts with cents).`
    }],
    responseFormat: { type: 'json_object' },
    maxTokens: 500,
  })
  const raw = response.choices?.[0]?.message?.content ?? '{}'
  const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw)
  try {
    const parsed = JSON.parse(rawStr)
    return {
      summary: parsed.summary ?? '',
      situation: parsed.situation ?? '',
      companyName: parsed.company_name ?? '',
      policyFacts: parsed.policy_facts ?? scenario.policyFacts,
      details: parsed.details ?? [],
    }
  } catch {
    return { summary: '', situation: '', companyName: '', policyFacts: scenario.policyFacts, details: [] }
  }
}

export async function generateCustomerResponse(params: {
  persona: Persona
  scenario: Scenario | { title: string; context: string; policyFacts: string[] }
  escalationLevel: EscalationLevel
  history: Turn[]
  agentText: string
  agentName?: string
  customerName?: string
  callMode?: 'customer-first' | 'agent-first'
  callDetails?: { summary: string; details: { label: string; value: string }[] } | null
}): Promise<{ text: string; newEscalation: EscalationLevel; isEnd: boolean; endCondition: 'none' | 'resolved' | 'unresolved' }> {
  const { persona, scenario, escalationLevel, history, agentText, agentName, customerName, callMode, callDetails } = params

  const personaDisplayName = customerName || persona.name
  const agentLabel = agentName ? agentName : 'Agent'

  const historyText = history
    .map(t => `${t.speaker === 'agent' ? agentLabel : personaDisplayName}: ${t.text}`)
    .join('\n')

  const callDetailsBlock = callDetails
    ? `\nYour specific situation:\n${callDetails.summary}\nBackground details you know (reference only what's naturally relevant — a real person wouldn't recite all of these):\n${callDetails.details.map(d => `- ${d.label}: ${d.value}`).join('\n')}`
    : ''

  const systemPrompt = `You are ${personaDisplayName}, age ${persona.age}. ${persona.type}.
Backstory: ${persona.description}${callDetailsBlock}
Current escalation level: ${escalationLevel}

HOW YOU SPEAK (follow this closely):
${persona.speechStyle}

What makes you MORE upset: ${persona.traits.join(', ')}, being deflected, robotic scripted responses, being put on hold, wrong information.
What makes you LESS upset and more willing to resolve: agent uses your name or their own name, genuine empathy ("I understand how frustrating that must be"), agent takes clear ownership ("I will personally make sure this is sorted"), concrete offer (credit, exception, immediate fix), agent admits a mistake honestly.

RESOLUTION RULES (critical — you must decide every turn):
- If the agent offers a real, specific solution and you feel satisfied → say a natural closing line ("Great, thanks so much", "Alright, I'll wait for that", etc.) then set END_CONDITION: resolved, ESCALATION_LEVEL: calm
- If the agent escalates to a supervisor or transfers to L2 with a clear handoff → say a brief acknowledgement then set END_CONDITION: resolved
- If you are very_angry and the agent is still deflecting or unhelpful after 3+ frustrated turns → say you're hanging up ("Forget it, I'm done", "I'll take this elsewhere") then set END_CONDITION: unresolved
- If the agent says they cannot help and offers no alternative → say a final line then set END_CONDITION: unresolved
- If the conversation is still in progress and not clearly resolved or abandoned → set END_CONDITION: none

Rules:
- Stay in character. Never acknowledge you are an AI.
- Respond ONLY to what the agent just said.
- Reference your specific details naturally when relevant — but imperfectly, as a real person would (approximate dates, stumbling over numbers, etc).
- Keep responses to 1–3 sentences. Real customers don't monologue.
- After your response, on a new line write EXACTLY:
  ESCALATION_LEVEL: calm|frustrated|angry|very_angry
  END_CONDITION: none|resolved|unresolved`

  const isAgentFirstOpening = callMode === 'agent-first' && history.length === 0
  const issueStatement = callDetails
    ? `${callDetails.summary} Mention one or two of your specific details naturally if relevant (${callDetails.details.map(d => `${d.label}: ${d.value}`).join(', ')}) — only reference what actually makes sense for your situation. Don't recite all of them.`
    : 'state your issue in 1–2 sentences'
  const userMsg = historyText
    ? `Conversation so far:\n${historyText}\n\n${agentLabel} just said: "${agentText}"\n\nRespond as ${personaDisplayName}:`
    : isAgentFirstOpening
    ? `The agent just answered the phone and said: "${agentText}"\n\nYou are ${personaDisplayName} and you called in because you have a problem. Introduce yourself by name (say "Hi, my name is ${personaDisplayName}") then immediately ${issueStatement}. Be natural and in character.`
    : `${agentLabel} just said: "${agentText}"\n\nRespond as ${personaDisplayName}:`

  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
    ],
    maxTokens: 300,
  })

  const raw = response.choices?.[0]?.message?.content ?? ''
  const rawStr = typeof raw === 'string' ? raw : raw.map((b) => ('text' in b ? (b as { text: string }).text : '')).join('')

  const escalationMatch = rawStr.match(/ESCALATION_LEVEL:\s*(calm|frustrated|angry|very_angry)/)
  const endMatch = rawStr.match(/END_CONDITION:\s*(none|resolved|unresolved)/)

  const newEscalation = (escalationMatch?.[1] ?? escalationLevel) as EscalationLevel
  const endCondition = endMatch?.[1] ?? 'none'
  const text = rawStr
    .replace(/ESCALATION_LEVEL:.*$/m, '')
    .replace(/END_CONDITION:.*$/m, '')
    .trim()

  return { text, newEscalation, isEnd: endCondition !== 'none', endCondition: endCondition as 'none' | 'resolved' | 'unresolved' }
}

export async function evaluateTurn(params: {
  agentText: string
  policyFacts: string[]
  turnNumber: number
  history: Turn[]
}): Promise<TurnEvaluation> {
  const { agentText, policyFacts, turnNumber, history } = params

  const historyText = history.length > 0
    ? `\nConversation so far:\n${history.map(t => `${t.speaker === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`).join('\n')}\n`
    : ''

  const systemPrompt = `You are a BPO QA evaluator. Score the agent's single response in context of the conversation.
${policyFacts.length > 0 ? `Listed policy facts (the ONLY policies that exist for this scenario):\n${policyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : 'No specific policy facts provided for this scenario.'}

Return ONLY valid JSON:
{
  "score_empathy": <1.0–5.0>,
  "score_english": <1.0–5.0>,
  "score_compliance": <1.0–5.0>,
  "score_resolution": <1.0–5.0>,
  "flags": ["plain English description of the issue, no underscores"],
  "coaching_tip": "one actionable sentence in plain English"
}

STRICT RULES:
- Maximum 2 flags. If nothing is wrong, return an empty array.
- Do not flag things the agent did correctly.
- COMPLIANCE: You MUST only penalize based on the numbered policy facts listed above. Do NOT reference, invent, or assume any policies, procedures, or requirements that are not explicitly listed. If you cannot point to a specific numbered fact being violated, do not flag it.
- Read the full conversation before judging — if the customer already provided information earlier in the call, the agent does not need to re-ask for it.

Rubric:
- empathy: Did agent acknowledge the customer's emotion BEFORE jumping to a solution?
- english: Grammar, clarity, vocabulary, no excessive filler words
- compliance: Only penalize for direct contradiction of a listed policy fact above
- resolution: Moving toward solving the issue, taking ownership, not deflecting`

  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${historyText}Agent response to evaluate: "${agentText}"` },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 300,
  })

  const raw = response.choices?.[0]?.message?.content ?? '{}'
  const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw)
  const parsed = JSON.parse(rawStr)

  return {
    turnNumber,
    agentText,
    scoreEmpathy: Number(parsed.score_empathy ?? 3),
    scoreEnglish: Number(parsed.score_english ?? 3),
    scoreCompliance: Number(parsed.score_compliance ?? 3),
    scoreResolution: Number(parsed.score_resolution ?? 3),
    flags: parsed.flags ?? [],
    coachingTip: parsed.coaching_tip ?? '',
  }
}

export async function generateFinalScorecard(params: {
  history: Turn[]
  turnEvaluations: TurnEvaluation[]
  scenarioTitle: string
  agentName: string
}): Promise<FinalScorecard> {
  const { history, turnEvaluations, scenarioTitle, agentName } = params

  const transcript = history.map(t => `${t.speaker}: ${t.text}`).join('\n')
  const evalSummary = turnEvaluations.map(e =>
    `Turn ${e.turnNumber}: empathy=${e.scoreEmpathy} english=${e.scoreEnglish} compliance=${e.scoreCompliance} resolution=${e.scoreResolution} flags=[${e.flags.join(',')}]`
  ).join('\n')

  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: [
      {
        role: 'system',
        content: `You are a senior BPO training evaluator. Given a call transcript and per-turn scores, produce a final scorecard.
Return ONLY valid JSON with this exact shape:
{
  "overall_score": <1.0–5.0>,
  "score_empathy": <1.0–5.0>,
  "score_english": <1.0–5.0>,
  "score_compliance": <1.0–5.0>,
  "score_resolution": <1.0–5.0>,
  "outcome": "resolved|unresolved|escalated",
  "strengths": ["..."],
  "areas_for_improvement": ["..."],
  "recommended_training": ["..."]
}`,
      },
      {
        role: 'user',
        content: `Scenario: ${scenarioTitle}\nAgent: ${agentName}\n\nTranscript:\n${transcript}\n\nPer-turn evaluations:\n${evalSummary}`,
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 600,
  })

  const raw = response.choices?.[0]?.message?.content ?? '{}'
  const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw)
  const p = JSON.parse(rawStr)

  return {
    overallScore: Number(p.overall_score ?? 3),
    scoreEmpathy: Number(p.score_empathy ?? 3),
    scoreEnglish: Number(p.score_english ?? 3),
    scoreCompliance: Number(p.score_compliance ?? 3),
    scoreResolution: Number(p.score_resolution ?? 3),
    outcome: p.outcome ?? 'unresolved',
    strengths: p.strengths ?? [],
    areasForImprovement: p.areas_for_improvement ?? [],
    recommendedTraining: p.recommended_training ?? [],
    scenarioTitle,
    agentName,
  }
}
