import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

export async function transcribe(audioB64: string): Promise<string> {
  const buffer = Buffer.from(audioB64, 'base64')
  const file = new File([buffer], 'audio.webm', { type: 'audio/webm' })
  const result = await mistral.audio.transcriptions.complete({
    model: 'voxtral-mini-latest',
    file,
  })
  return result.text
}
