import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'
import { useStore } from '@/lib/store'
import { AudioRecorder, playAudioFromBase64, getOutputVolume, stopAudio } from '@/lib/audio'
import { CadenceSocket, setNavigate } from '@/lib/socket'
import { Orb } from '@/components/ui/orb'
import { Matrix, loader } from '@/components/ui/matrix'
import { PhoneDisconnect, Question, WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react'
import type { EscalationLevel } from '@/types'

const ORB_COLORS: Record<string, Record<EscalationLevel, [string, string]>> = {
  'angry-mark':          { calm: ['#FED7AA','#EA580C'], frustrated: ['#FDBA74','#C2410C'], angry: ['#F87171','#DC2626'], very_angry: ['#EF4444','#991B1B'] },
  'lola-carmen':         { calm: ['#DDD6FE','#7C3AED'], frustrated: ['#C4B5FD','#6D28D9'], angry: ['#A78BFA','#5B21B6'], very_angry: ['#8B5CF6','#4C1D95'] },
  'firm-andrea':         { calm: ['#BAE6FD','#0369A1'], frustrated: ['#7DD3FC','#0284C7'], angry: ['#38BDF8','#075985'], very_angry: ['#0EA5E9','#0C4A6E'] },
  'frustrated-dev':      { calm: ['#BBF7D0','#15803D'], frustrated: ['#86EFAC','#166534'], angry: ['#4ADE80','#14532D'], very_angry: ['#22C55E','#052E16'] },
  'impatient-exec':      { calm: ['#E0E7FF','#4338CA'], frustrated: ['#C7D2FE','#3730A3'], angry: ['#A5B4FC','#312E81'], very_angry: ['#818CF8','#1E1B4B'] },
  'first-time-caller':   { calm: ['#FBCFE8','#BE185D'], frustrated: ['#F9A8D4','#9D174D'], angry: ['#F472B6','#831843'], very_angry: ['#EC4899','#500724'] },
  'aggressive-disputer': { calm: ['#FEE2E2','#B91C1C'], frustrated: ['#FECACA','#991B1B'], angry: ['#F87171','#7F1D1D'], very_angry: ['#DC2626','#450A0A'] },
  'language-barrier':    { calm: ['#CFFAFE','#0E7490'], frustrated: ['#A5F3FC','#0891B2'], angry: ['#67E8F9','#155E75'], very_angry: ['#22D3EE','#083344'] },
}
const DEFAULT_ORB_COLORS: Record<EscalationLevel, [string, string]> = {
  calm: ['#CADCFC','#A0B9D1'], frustrated: ['#FDE68A','#D97706'], angry: ['#FCA5A5','#DC2626'], very_angry: ['#F87171','#991B1B'],
}

const ESCALATION_DOT: Record<EscalationLevel, string> = {
  calm: 'bg-green-500',
  frustrated: 'bg-yellow-400',
  angry: 'bg-orange-500',
  very_angry: 'bg-red-500',
}

const ESCALATION_LABEL: Record<EscalationLevel, string> = {
  calm: 'Calm',
  frustrated: 'Frustrated',
  angry: 'Angry',
  very_angry: 'Very Angry',
}

const SCORE_DESCRIPTIONS: Record<string, string> = {
  Empathy: 'Did you acknowledge the customer\'s emotion before jumping to a solution?',
  English: 'Grammar, clarity, vocabulary, and avoiding excessive filler words.',
  Compliance: 'Staying within policy — not promising what you can\'t deliver.',
  Resolution: 'Moving toward solving the issue; taking ownership, not deflecting.',
}

export default function Call() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const socketRef = useRef<CadenceSocket | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const isSpaceDown = useRef(false)
  const isRecordingRef = useRef(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [wsError, setWsError] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const {
    selectedPersona, selectedScenario, agentName,
    openingAudioB64, openingLine, callMode, voiceId, escalationLevel, agentState, setAgentState,
    turns, liveFlags, turnEvaluations, addTurn,
    isRecording, setRecording, isSpeaking,
    customScenario, customerName, callDetails,
    setScorecardLoading, callEnding,
  } = useStore()

  const avatarUrl = useMemo(() => {
    if (!selectedPersona) return ''
    const avatar = createAvatar(glass, { seed: selectedPersona.id, size: 40, radius: 50, backgroundType: ['gradientLinear'] })
    return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`
  }, [selectedPersona?.id])

  const getInputVolume = useCallback(() => recorderRef.current?.getInputVolume() ?? 0, [])

  useEffect(() => { setNavigate(navigate) }, [navigate])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [turns])

  useEffect(() => {
    const socket = new CadenceSocket()
    socketRef.current = socket
    socket.connect(`${import.meta.env.VITE_WS_URL}/call/${sessionId}`, {
      onOpen: () => { setWsConnected(true); setWsError(false) },
      onError: () => setWsError(true),
      onClose: () => { if (!useStore.getState().scorecardLoading) setWsConnected(false) },
    })

    const recorder = new AudioRecorder()
    recorderRef.current = recorder
    recorder.init().catch(console.error)

    if (callMode === 'customer-first' && openingAudioB64 && openingLine) {
      setAgentState('talking')
      if (useStore.getState().turns.length === 0) {
        addTurn({ speaker: 'customer', text: openingLine })
      }
      playAudioFromBase64(openingAudioB64).then(() => setAgentState(null))
    }

    return () => {
      stopAudio()
      // Don't close socket if we're waiting for the scorecard — it needs to receive final_scorecard
      if (!useStore.getState().scorecardLoading) {
        socket.close()
      }
      recorder.destroy()
    }
  }, [sessionId])

  const sendCurrentTurn = useCallback(async () => {
    const audioB64 = await recorderRef.current?.stop()
    if (!audioB64 || audioB64.length < 1000) {
      useStore.getState().setAgentState(null)
      useStore.getState().setRecording(false)
      return
    }
    const state = useStore.getState()
    socketRef.current?.sendTurn({
      type: 'turn',
      audioB64,
      history: state.turns,
      escalationLevel: state.escalationLevel,
      scenarioId: selectedScenario?.id,
      personaId: selectedPersona?.id,
      agentName,
      customScenario: customScenario ?? undefined,
      customerName: customerName ?? undefined,
      callMode,
      callDetails: callDetails ?? undefined,
      voiceId: voiceId ?? undefined,
    })
  }, [selectedScenario?.id, selectedPersona?.id, agentName, customScenario, customerName, callMode, callDetails, voiceId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const { isSpeaking, agentState } = useStore.getState()
      if (isSpaceDown.current || isSpeaking || agentState === 'thinking') return
      e.preventDefault()
      isSpaceDown.current = true
      isRecordingRef.current = true
      setRecording(true)
      setAgentState('listening')
      recorderRef.current?.start()
    }
    const onKeyUp = async (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (!isSpaceDown.current) return
      isSpaceDown.current = false
      isRecordingRef.current = false
      setRecording(false)
      setAgentState('thinking')
      await sendCurrentTurn()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [sendCurrentTurn])

  // Mic VU levels — 12 columns sampled from analyser when recording
  const [vuLevels, setVuLevels] = useState<number[]>(Array(12).fill(0))
  const vuRafRef = useRef<number | null>(null)

  useEffect(() => {
    const sample = () => {
      const analyser = recorderRef.current?.getAnalyser()
      if (analyser && useStore.getState().isRecording) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const cols = 12
        const binSize = Math.floor(data.length / cols)
        const levels = Array.from({ length: cols }, (_, i) => {
          const start = i * binSize
          const slice = data.slice(start, start + binSize)
          const avg = slice.reduce((a, b) => a + b, 0) / slice.length
          return Math.min(1, avg / 200)
        })
        setVuLevels(levels)
      } else {
        setVuLevels(Array(12).fill(0))
      }
      vuRafRef.current = requestAnimationFrame(sample)
    }
    vuRafRef.current = requestAnimationFrame(sample)
    return () => { if (vuRafRef.current) cancelAnimationFrame(vuRafRef.current) }
  }, [])

  const agentTurnCount = turns.filter(t => t.speaker === 'agent').length
  const latestEval = turnEvaluations[turnEvaluations.length - 1]
  const displayName = customerName ?? customScenario?.personaNameOverride ?? selectedPersona?.name
  const orbColors = (selectedPersona ? (ORB_COLORS[selectedPersona.id] ?? DEFAULT_ORB_COLORS) : DEFAULT_ORB_COLORS)[escalationLevel]

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* WS error banner */}
      {wsError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border-b border-red-200 px-5 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-red-700">
            <WarningCircle size={15} weight="fill" />
            <span className="text-xs font-medium">Connection lost. The backend may be cold-starting — please wait a moment.</span>
          </div>
          <button
            onClick={() => {
              setWsError(false)
              const socket = new CadenceSocket()
              socketRef.current = socket
              socket.connect(`${import.meta.env.VITE_WS_URL}/call/${sessionId}`, {
                onOpen: () => { setWsConnected(true); setWsError(false) },
                onError: () => setWsError(true),
                onClose: () => { if (!useStore.getState().scorecardLoading) setWsConnected(false) },
              })
            }}
            className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
          >
            <ArrowCounterClockwise size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="h-12 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/"><img src="/logo.webp" alt="Cadence" className="h-5 w-auto" /></a>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 font-medium">{selectedScenario?.title ?? customScenario?.title ?? 'Custom Scenario'}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={clsx('w-1.5 h-1.5 rounded-full', ESCALATION_DOT[escalationLevel])} />
            <span className="text-xs text-gray-500">{ESCALATION_LABEL[escalationLevel]}</span>
          </div>
          <span className="text-xs text-gray-400">Turn {agentTurnCount}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: conversation ── */}
        <div className="flex flex-col border-r border-gray-200" style={{ width: '58%' }}>

          {/* Customer identity row */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full flex-shrink-0" />
              : <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 leading-none">{displayName}</div>
              <div className="text-xs text-gray-400 mt-0.5">{selectedPersona?.type}</div>
            </div>
            {isSpeaking && (
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-3 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}
            {callEnding ? (
              <div className={clsx(
                'ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md',
                callEnding === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              )}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: callEnding === 'resolved' ? '#16a34a' : '#ea580c' }} />
                {callEnding === 'resolved' ? 'Call resolved — wrapping up…' : 'Customer hung up — wrapping up…'}
              </div>
            ) : (
              <button
                onClick={() => {
                  stopAudio()
                  const state = useStore.getState()
                  const hasAgentTurns = state.turns.some(t => t.speaker === 'agent')
                  if (!hasAgentTurns) return
                  setScorecardLoading(true)
                  socketRef.current?.sendEndCall({
                    history: state.turns,
                    scenarioId: selectedScenario?.id,
                    personaId: selectedPersona?.id,
                    agentName,
                    customScenario: customScenario ?? undefined,
                  })
                  navigate(`/assessment/${sessionId}`)
                }}
                title={turns.some(t => t.speaker === 'agent') ? 'End the call' : 'Speak at least once before ending'}
                className={clsx(
                  'ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors',
                  turns.some(t => t.speaker === 'agent')
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <PhoneDisconnect size={13} weight="fill" />
                End Call
              </button>
            )}
          </div>

          {/* Orb */}
          <div className="flex justify-center items-center py-6 flex-shrink-0">
            <Orb
              colors={orbColors}
              agentState={agentState}
              getInputVolume={getInputVolume}
              getOutputVolume={getOutputVolume}
              className="w-32 h-32"
            />
          </div>

          {/* Transcript */}
          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
            {turns.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-4">
                {callMode === 'agent-first' ? 'Customer is waiting — introduce yourself' : 'Hold Space to speak'}
              </p>
            ) : turns.map((t, i) => (
              <div key={i} className={clsx('flex', t.speaker === 'agent' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[72%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                  t.speaker === 'agent'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {t.text}
                </div>
              </div>
            ))}
          </div>

          {/* Mic visualizer + Record button */}
          <div className="border-t border-gray-200 px-5 pt-3 pb-4 flex-shrink-0">
            {/* VU meter — only visible while recording */}
            <div className={clsx('flex justify-center transition-all duration-200', isRecording ? 'opacity-100 mb-3' : 'opacity-0 h-0 overflow-hidden')}>
              <Matrix
                rows={7}
                cols={12}
                mode="vu"
                levels={vuLevels}
                size={6}
                gap={2}
                palette={{ on: '#2563eb', off: '#dbeafe' }}
                ariaLabel="Microphone level"
              />
            </div>

            <button
              disabled={isSpeaking || agentState === 'thinking'}
              onMouseDown={() => {
                const { isSpeaking, agentState } = useStore.getState()
                if (isSpeaking || agentState === 'thinking') return
                isRecordingRef.current = true
                setRecording(true)
                setAgentState('listening')
                recorderRef.current?.start()
              }}
              onMouseUp={async () => {
                if (!isRecordingRef.current) return
                isRecordingRef.current = false
                setRecording(false)
                setAgentState('thinking')
                await sendCurrentTurn()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                const { isSpeaking, agentState } = useStore.getState()
                if (isSpeaking || agentState === 'thinking') return
                isRecordingRef.current = true
                setRecording(true)
                setAgentState('listening')
                recorderRef.current?.start()
              }}
              onTouchEnd={async (e) => {
                e.preventDefault()
                if (!isRecordingRef.current) return
                isRecordingRef.current = false
                setRecording(false)
                setAgentState('thinking')
                await sendCurrentTurn()
              }}
              className={clsx(
                'w-full py-4 rounded-xl text-sm font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-1 select-none touch-none',
                isRecording
                  ? 'bg-blue-600 text-white scale-[0.98] shadow-inner'
                  : agentState === 'thinking'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md'
              )}
            >
              {agentState === 'thinking' ? (
                <div className="flex items-center gap-2">
                  <Matrix rows={7} cols={7} frames={loader} fps={12} size={7} gap={1}
                    palette={{ on: '#9ca3af', off: '#e5e7eb' }} ariaLabel="Processing" />
                  <span className="text-gray-400 text-sm">Processing…</span>
                </div>
              ) : isRecording ? (
                <>
                  <span className="text-base">Release to send</span>
                  <span className="text-blue-200 text-xs">Recording…</span>
                </>
              ) : (
                <>
                  <span className="text-base">{callMode === 'agent-first' && turns.length === 0 ? 'Hold to introduce yourself' : 'Hold to speak'}</span>
                  <span className="text-blue-200 text-xs flex items-center gap-1">
                    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500 text-white border border-blue-400 leading-none">
                      Space
                    </kbd>
                    <span>on desktop · tap &amp; hold on mobile</span>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="flex flex-col overflow-hidden bg-white" style={{ width: '42%' }}>

          {/* Scenario brief */}
          {callDetails && (
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Scenario Brief</p>
              {callDetails.companyName && (
                <p className="text-xs text-gray-500 mb-1.5">
                  You work for <span className="font-semibold text-gray-900">{callDetails.companyName}</span>
                </p>
              )}
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{callDetails.summary}</p>
              <div className="space-y-1 mb-3">
                {callDetails.details.map(({ label, value }) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
                    <span className="font-mono font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
              {callDetails.policyFacts?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Policy</p>
                  <div className="space-y-1">
                    {callDetails.policyFacts.map((fact, i) => (
                      <p key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-gray-300 flex-shrink-0">—</span>
                        {fact}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Escalation bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Escalation</p>
              <div className="flex items-center gap-1.5">
                <span className={clsx('w-1.5 h-1.5 rounded-full', ESCALATION_DOT[escalationLevel])} />
                <span className="text-xs text-gray-600">{ESCALATION_LABEL[escalationLevel]}</span>
              </div>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={clsx(
                'h-full rounded-full transition-all duration-700',
                escalationLevel === 'calm' && 'bg-green-400 w-1/4',
                escalationLevel === 'frustrated' && 'bg-yellow-400 w-2/4',
                escalationLevel === 'angry' && 'bg-orange-500 w-3/4',
                escalationLevel === 'very_angry' && 'bg-red-500 w-full',
              )} />
            </div>
          </div>

          {/* Scores */}
          <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Scores</p>
            {[
              { label: 'Empathy',     value: latestEval?.scoreEmpathy ?? 0 },
              { label: 'English',     value: latestEval?.scoreEnglish ?? 0 },
              { label: 'Compliance',  value: latestEval?.scoreCompliance ?? 0 },
              { label: 'Resolution',  value: latestEval?.scoreResolution ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-xs text-gray-500">{label}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === label ? null : label)}
                      className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                      aria-label={`What is ${label} scored on?`}
                    >
                      <Question size={11} weight="bold" />
                    </button>
                  </div>
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(value / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right tabular-nums">
                    {value > 0 ? value.toFixed(1) : '—'}
                  </span>
                </div>
                {activeTooltip === label && (
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-1 pl-0 pr-6">
                    {SCORE_DESCRIPTIONS[label]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Live coaching */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Coaching</p>
            {liveFlags.length === 0 ? (
              <p className="text-xs text-gray-300">Tips appear after each turn.</p>
            ) : (
              [...liveFlags].reverse().map((f, i) => (
                <div key={i} className={clsx(
                  'mb-2 px-3 py-2 rounded-lg text-xs leading-relaxed border-l-2',
                  f.type === 'warning' && 'bg-red-50 border-l-red-400 text-red-700',
                  f.type === 'success' && 'bg-green-50 border-l-green-500 text-green-700',
                  f.type === 'info'    && 'bg-gray-50 border-l-gray-400 text-gray-600',
                )}>
                  <span className="text-gray-400 text-[10px] block mb-0.5">Turn {f.turn}</span>
                  {f.message}
                </div>
              ))
            )}
          </div>

          {/* Turn progress */}
          <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400">Turn {agentTurnCount} of ~{selectedScenario?.estimatedTurns ?? 8}</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: selectedScenario?.estimatedTurns ?? 8 }).map((_, i) => (
                <div key={i} className={clsx(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  i < agentTurnCount ? 'bg-blue-600' : 'bg-gray-100'
                )} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
