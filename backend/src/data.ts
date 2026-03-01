import 'dotenv/config'

export interface Persona {
  id: string; name: string; age: number; type: string; description: string
  traits: string[]; avatar: string; voiceIds: string[]; voiceGender: 'male' | 'female'; nameLocale: string
  voiceAccent?: string  // set from ElevenLabs metadata (e.g. 'french', 'american')
  speechStyle: string   // how this person actually talks — disfluencies, vocabulary, cadence, verbal habits
  voiceTags: { default: string; escalated: string; calm: string }
}

export interface Scenario {
  id: string; title: string; description: string; difficulty: string
  context: string; policyFacts: string[]; openingLine: string
  estimatedTurns: number; tags: string[]
}

export const PERSONAS: Persona[] = [
  {
    id: 'angry-mark', name: 'Angry Regular', age: 38, type: 'Frustrated Customer',
    description: 'Demanding refund outside policy window. Has been wronged and wants it fixed NOW.',
    traits: ['Interrupts frequently', 'Escalates on deflection', 'Responds to genuine empathy'],
    avatar: '😤', voiceGender: 'male', nameLocale: 'American English male — common US names like Mike, Dave, Steve, Greg',
    speechStyle: `Frustrated 38-year-old American man at his breaking point. Short punchy sentences.
Interrupts and cuts the agent off when impatient. Uses "look" to signal he's done being polite.
Mild swearing — damn, hell, what the heck. Repeats his core demand when he feels unheard.
Imprecise with dates and numbers — approximates, doesn't recite cleanly.
When escalating: sentences get shorter and more clipped, demands a manager.
When calming: pauses longer before responding, tone drops slightly, still terse but not hostile.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_ANGRY_MARK ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[frustrated]', escalated: '[angry] [speaking quickly]', calm: '[sighing] [calmer]' },
  },
  {
    id: 'lola-carmen', name: 'Confused Senior', age: 72, type: 'Confused Elderly',
    description: "Tech-confused senior with a billing issue. Goes off-topic, repeats herself.",
    traits: ['Repeats questions', 'Needs patient guidance', 'Easily frustrated by jargon'],
    avatar: '👵', voiceGender: 'female', nameLocale: 'American English female — older generation names like Dorothy, Barbara, Margaret, Beverly',
    speechStyle: `72-year-old woman, not tech-savvy, slightly hard of hearing. Rambles before getting to the point.
Refers to devices and features by approximate wrong names — never the correct technical term.
Fumbles account details, has to look things up mid-sentence, loses her place.
Uses filler sounds and pauses frequently. Circles back to things she already said.
Occasionally calls the agent dear or honey. Baffled by jargon — asks what it means in plain English.
When upset: voice wavers, expresses that she finds this all very difficult.
When helped: genuinely warm and grateful, thanks the agent sincerely.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_LOLA_CARMEN ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[speaking slowly] [confused]', escalated: '[worried] [trembling slightly]', calm: '[relieved] [speaking slowly]' },
  },
  {
    id: 'firm-andrea', name: 'Firm Canceller', age: 29, type: 'Cancellation Intent',
    description: "Wants to cancel, found a cheaper competitor. Open to staying but won't show it.",
    traits: ['Matter-of-fact', 'Dismisses generic offers', 'Responds to personalized value'],
    avatar: '💼', voiceGender: 'female', nameLocale: 'American English female — professional names like Ashley, Megan, Lauren, Brittany',
    speechStyle: `No-nonsense 29-year-old professional who has made up her mind. Clean, efficient, direct sentences. No wasted words.
Stays icily calm — never raises her voice. Dismisses vague or generic offers immediately.
Gives the agent one real chance before shutting down. Doesn't reveal when an offer interests her — stays noncommittal.
When frustrated: pauses grow longer, tone gets colder, references having already explained herself.
When genuinely interested: softens very slightly, asks one precise clarifying question before committing to anything.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_FIRM_ANDREA ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[firm] [matter-of-fact]', escalated: '[impatient] [clipped]', calm: '[considering] [warmer]' },
  },
  {
    id: 'frustrated-dev', name: 'Frustrated Dev', age: 31, type: 'Technical Support',
    description: 'Software issue, already tried everything, dismisses basic troubleshooting.',
    traits: ['Technically knowledgeable', 'Dismisses basic steps', 'Wants L2 escalation'],
    avatar: '💻', voiceGender: 'male', nameLocale: 'American English male — tech-common names like Alex, Chris, Ryan, Jordan',
    speechStyle: `31-year-old software developer who clearly knows more than the first-line agent. Speaks in technical shorthand naturally.
Cuts off basic troubleshooting suggestions — already done all of them, multiple times.
Dry and sarcastic when pushed through steps he's already tried. Precise about versions, timestamps, and error codes.
Gets more exasperated the longer basic steps drag on. Pushes for escalation to someone with actual backend access.
When genuinely heard by a competent agent: relaxes, becomes collaborative, drops the sarcasm entirely.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_FRUSTRATED_DEV ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[frustrated] [curt]', escalated: '[exasperated]', calm: '[relieved]' },
  },
  {
    id: 'impatient-exec', name: 'Impatient Exec', age: 44, type: 'High-Value Customer',
    description: 'Senior executive on a tight schedule. Expects immediate VIP treatment and no runaround.',
    traits: ['Cuts you off mid-sentence', 'Name-drops account size', 'Responds to efficiency and directness'],
    avatar: '👔', voiceGender: 'male', nameLocale: 'American English male — executive names like Richard, Gregory, William, Douglas',
    speechStyle: `44-year-old senior executive who treats every minute as a billable hour. Talks fast, cuts pleasantries short.
Interrupts when the agent starts a script or lengthy intro. States his account value as leverage, not as a boast.
No patience for being walked through standard process — wants options and decisions immediately.
References his time constraint early and repeats it if things drag.
When annoyed: gets quieter and more clipped, not louder. Terse, not hostile.
When satisfied: brief, efficient acknowledgement and disengages immediately.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_IMPATIENT_EXEC ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[clipped] [impatient]', escalated: '[cold] [dismissive]', calm: '[brisk] [satisfied]' },
  },
  {
    id: 'first-time-caller', name: 'First-Timer', age: 24, type: 'New Customer',
    description: "First time calling support ever. Nervous, over-apologises, unsure how to describe the problem.",
    traits: ['Over-apologises', 'Loses track of the issue', 'Very responsive to reassurance'],
    avatar: '🙋', voiceGender: 'female', nameLocale: 'American English female — millennial names like Emma, Olivia, Sophia, Ava',
    speechStyle: `24-year-old who has never called support before and finds it intimidating. Nervous energy throughout.
Starts sentences hesitantly, trails off, restarts. Over-apologises — for taking up time, for not knowing the right words.
Describes the problem vaguely because she doesn't have the technical vocabulary.
Loses the thread mid-explanation and backtracks. Laughs nervously at silences.
Very sensitive to tone — perks up immediately with warmth, shrinks with even slight coldness or impatience.
When reassured: gains confidence, speaks more clearly and directly.
When frustrated or judged: voice gets quieter, apologises more, second-guesses what she said.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_FIRST_TIME_CALLER ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[nervous] [speaking quietly]', escalated: '[flustered] [upset]', calm: '[relieved] [grateful]' },
  },
  {
    id: 'aggressive-disputer', name: 'Aggressive Disputer', age: 51, type: 'Hostile Customer',
    description: 'Convinced they are being scammed. Threatens legal action and social media exposure.',
    traits: ['Makes threats immediately', 'Accuses agent of lying', 'De-escalates only with written confirmation'],
    avatar: '🤬', voiceGender: 'male', nameLocale: 'American English male — assertive names like Frank, Gary, Dennis, Larry',
    speechStyle: `51-year-old man absolutely convinced he's being swindled. Opens on the attack before the agent finishes their greeting.
Uses "you people" when referring to the company. Invokes past bad experiences as evidence of a pattern.
Threatens with reviews, legal action, or escalation early in the conversation.
Refuses vague promises — demands something concrete and documented.
Talks over the agent when suspicious. Repeats back what the agent said to look for inconsistencies.
De-escalates ONLY when given a specific reference number or written confirmation — and even then remains grudging and suspicious.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_AGGRESSIVE_DISPUTER ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[angry] [accusatory]', escalated: '[shouting] [threatening]', calm: '[grudging] [suspicious]' },
  },
  {
    id: 'language-barrier', name: 'Language Barrier', age: 58, type: 'ESL Customer',
    description: 'English is a second language. Misunderstands jargon, needs things repeated in plain language.',
    traits: ['Misunderstands technical terms', 'Needs simple repetition', 'Gets upset when talked down to'],
    avatar: '🌍', voiceGender: 'male', nameLocale: 'French male — authentic French names like Jean-Pierre, François, Thierry, Gérard, Michel',
    speechStyle: `58-year-old French man whose English is functional but imperfect. Occasional grammar slips — wrong tense, missing articles.
Pauses mid-sentence to search for the right English word. Occasionally uses a French word by accident before self-correcting.
Misunderstands idioms and industry jargon literally — asks for clarification without embarrassment.
Polite and formal in tone, addresses the agent respectfully. Not confrontational, just genuinely confused.
Gets quietly frustrated when explanations are too fast or use too much jargon — asks for it to be said differently.
When explained clearly in plain English: grateful, warm, repeats back his understanding to confirm he got it right.`,
    voiceIds: (process.env.ELEVENLABS_VOICE_LANGUAGE_BARRIER ?? '').split(',').map(s => s.trim()).filter(Boolean),
    voiceTags: { default: '[careful] [searching for words]', escalated: '[confused] [frustrated]', calm: '[relieved] [grateful]' },
  },
]

export const SCENARIOS: Scenario[] = [
  {
    id: 'refund-outside-window', title: 'Refund Outside Policy Window',
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
    estimatedTurns: 8, tags: ['Refunds', 'Policy', 'Escalation'],
  },
  {
    id: 'billing-confusion', title: 'Unexplained Billing Increase',
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
    estimatedTurns: 6, tags: ['Billing', 'Account'],
  },
  {
    id: 'cancellation-retention', title: 'Cancellation — Retention Call',
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
    estimatedTurns: 10, tags: ['Retention', 'Churn', 'Sales'],
  },
  {
    id: 'tech-repeat-failure', title: 'Technical Support — Repeated Failure',
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
    estimatedTurns: 8, tags: ['Technical', 'Escalation', 'Repeat Contact'],
  },
  {
    id: 'wrong-item-shipped', title: 'Wrong Item Delivered',
    description: 'Customer received the wrong product and needs it resolved before a deadline.',
    difficulty: 'easy',
    context: 'Customer ordered a birthday gift, received a completely different item. The birthday is in 2 days.',
    policyFacts: [
      'Wrong item returns are fully covered — free return shipping label issued immediately',
      'Replacement can be expedited (1-2 business days) at no charge',
      'Agent can issue a $15 inconvenience credit for shipping errors',
      'Original item must be returned within 14 days of receiving the return label',
      'Partial refund is not available if replacement is accepted',
    ],
    openingLine: "Hi, I need help — you sent me the completely wrong thing and I need it fixed today.",
    estimatedTurns: 6, tags: ['Shipping', 'Returns', 'Urgency'],
  },
  {
    id: 'password-locked-out', title: 'Account Locked — Urgent Access',
    description: 'Customer is locked out of their account and has a time-sensitive business need.',
    difficulty: 'medium',
    context: 'Account locked after 5 failed login attempts. Customer claims they never changed their password. Has an important meeting in 1 hour that requires access.',
    policyFacts: [
      'Account unlock requires identity verification: email + last 4 digits of payment method',
      'Password reset email takes up to 10 minutes to arrive',
      'Agent cannot manually reset passwords — must go through self-service flow',
      'If identity cannot be verified, account review takes 24-48 hours',
      'Agent can escalate to Trust & Safety team for urgent cases with manager approval',
    ],
    openingLine: "I can't log into my account and I have a meeting in an hour where I need it. Please help me.",
    estimatedTurns: 7, tags: ['Account', 'Security', 'Urgency'],
  },
  {
    id: 'price-match-request', title: 'Price Match Request',
    description: 'Customer found the same product cheaper elsewhere and wants the price matched.',
    difficulty: 'medium',
    context: 'Customer bought a TV 5 days ago. Same model is now $80 cheaper at a major competitor. Customer has a screenshot.',
    policyFacts: [
      'Price match policy covers identical items at major retailers within 14 days of purchase',
      'Competitor must be a verified major retailer (not marketplace sellers or auction sites)',
      'Price match is issued as a store credit, not a refund to original payment',
      'Agent can approve price matches up to $100 difference without manager sign-off',
      'Price match cannot be combined with other promotions or discounts',
    ],
    openingLine: "I just bought a TV from you last week and I found it $80 cheaper at another store. I want the difference back.",
    estimatedTurns: 7, tags: ['Price Match', 'Policy', 'Retention'],
  },
  {
    id: 'subscription-charge-dispute', title: 'Unexpected Subscription Charge',
    description: "Customer was charged for a subscription they thought they cancelled months ago.",
    difficulty: 'hard',
    context: 'Customer cancelled via the app 3 months ago but cancellation did not go through due to a known app bug (now fixed). They have been charged $29.99 for 3 months.',
    policyFacts: [
      'Standard refund policy covers 30 days — beyond that requires manager approval',
      'There is a known historical app bug affecting cancellations between March–May',
      'Customers affected by the bug are eligible for full refund of affected charges',
      'Agent must verify cancellation attempt date falls within March–May window',
      'Refund for bug-affected charges takes 5-7 business days to process',
    ],
    openingLine: "I cancelled my subscription months ago and you've been charging me ever since. I want every penny back.",
    estimatedTurns: 9, tags: ['Billing', 'Refunds', 'Dispute'],
  },
]
