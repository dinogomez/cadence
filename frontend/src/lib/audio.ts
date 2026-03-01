export class AudioRecorder {
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null

  async init(): Promise<void> {
    console.log('[recorder] init() — requesting mic')
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    })
    console.log('[recorder] init() — got stream, tracks:', this.stream.getTracks().map(t => `${t.kind}:${t.readyState}`))
    this.audioContext = new AudioContext()
    const source = this.audioContext.createMediaStreamSource(this.stream)
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    source.connect(this.analyser)
  }

  mediaRecorderState(): string {
    return this.mediaRecorder?.state ?? 'none'
  }

  start(): void {
    if (!this.stream) throw new Error('AudioRecorder not initialized')
    console.log('[recorder] start() — stream active:', this.stream.active, 'tracks:', this.stream.getTracks().map(t => t.readyState))
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    this.mediaRecorder.start()
  }

  stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('Not recording'))
      const chunks: Blob[] = []
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          resolve(dataUrl.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      }
      this.mediaRecorder.stop()
    })
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getInputVolume(): number {
    if (!this.analyser) return 0
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    return data.reduce((a, b) => a + b, 0) / data.length / 128
  }

  destroy(): void {
    this.stream?.getTracks().forEach(t => t.stop())
    this.audioContext?.close()
    this.stream = null
    this.mediaRecorder = null
    this.audioContext = null
    this.analyser = null
  }
}

let outputVolume = 0
let activeAudio: HTMLAudioElement | null = null

export function getOutputVolume(): number {
  return outputVolume
}

export function stopAudio(): void {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
    outputVolume = 0
  }
}

export async function playAudioFromBase64(b64: string): Promise<void> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  activeAudio = audio

  // Use a fresh AudioContext per playback to avoid InvalidStateError
  // from reusing createMediaElementSource on different elements
  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(audio)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  analyser.connect(ctx.destination)

  // Poll volume into module-level var so getOutputVolume() works
  let rafId: number
  const poll = () => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    outputVolume = data.reduce((a, b) => a + b, 0) / data.length / 128
    rafId = requestAnimationFrame(poll)
  }
  poll()

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      cancelAnimationFrame(rafId)
      outputVolume = 0
      activeAudio = null
      URL.revokeObjectURL(url)
      ctx.close()
      resolve()
    }
    audio.onerror = reject
    audio.play().catch(reject)
  })
}
