import { ElevenLabsClient } from 'elevenlabs'
import type { EscalationLevel } from '../types.js'

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

const EMOTION_TAGS: Record<EscalationLevel, string> = {
  calm: '[warm] [speaking slowly]',
  frustrated: '[frustrated]',
  angry: '[angry] [speaking quickly]',
  very_angry: '[shouting] [angry]',
}

export async function synthesize(text: string, voiceId: string, escalation: EscalationLevel): Promise<string> {
  const taggedText = `${EMOTION_TAGS[escalation]} ${text}`
  const stream = await client.textToSpeech.convert(voiceId, {
    text: taggedText,
    model_id: 'eleven_v3',
    voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.6 },
    output_format: 'mp3_44100_128',
  })

  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  return buffer.toString('base64')
}
