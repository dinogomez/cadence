import { PERSONAS } from '../data.js'

const ACCENT_LOCALE_MAP: Record<string, string> = {
  american:   'American English',
  british:    'British English',
  australian: 'Australian English',
  irish:      'Irish English',
  scottish:   'Scottish English',
  french:     'French',
  german:     'German',
  spanish:    'Spanish',
  italian:    'Italian',
  portuguese: 'Portuguese',
  dutch:      'Dutch',
  swedish:    'Swedish',
  polish:     'Polish',
  russian:    'Russian',
  japanese:   'Japanese',
  chinese:    'Chinese',
  korean:     'Korean',
  arabic:     'Arabic',
  hindi:      'Hindi',
}

function buildNameLocale(gender: string, accent: string): string {
  const genderLabel = gender === 'female' ? 'female' : 'male'
  const locale = ACCENT_LOCALE_MAP[accent.toLowerCase()] ?? accent
  return `${locale} ${genderLabel} — realistic ${locale} ${genderLabel} names`
}

export function pickVoiceId(persona: { voiceIds: string[] }): string {
  const ids = persona.voiceIds
  if (ids.length === 0) return ''
  return ids[Math.floor(Math.random() * ids.length)]
}

export async function resolveVoiceMeta(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.warn('[voices] No ELEVENLABS_API_KEY — skipping voice metadata resolution')
    return
  }

  await Promise.all(
    PERSONAS.map(async (persona) => {
      if (persona.voiceIds.length === 0) return

      // Validate all IDs in parallel, filter out any that are invalid/inaccessible
      const results = await Promise.all(
        persona.voiceIds.map(async (voiceId) => {
          try {
            const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
              headers: { 'xi-api-key': apiKey },
            })
            if (!res.ok) return null
            const data = await res.json() as { name?: string; labels?: { gender?: string; accent?: string } }
            if (!data.name) return null  // invalid voice
            return { voiceId, gender: data.labels?.gender?.toLowerCase() ?? '', accent: data.labels?.accent?.toLowerCase() ?? '' }
          } catch {
            return null
          }
        })
      )

      const valid = results.filter(Boolean) as { voiceId: string; gender: string; accent: string }[]

      if (valid.length === 0) {
        console.warn(`[voices] ${persona.id}: no valid voice IDs found`)
        return
      }

      // Replace voiceIds with only the valid ones
      persona.voiceIds = valid.map(v => v.voiceId)

      // Use first valid voice to determine gender/locale
      const { gender, accent } = valid[0]
      if (gender === 'female' || gender === 'male') persona.voiceGender = gender
      if (accent) persona.nameLocale = buildNameLocale(persona.voiceGender, accent)

      console.log(`[voices] ${persona.id}: gender=${persona.voiceGender} accent=${accent} (${valid.length}/${results.length} valid)`)
    })
  )
}
