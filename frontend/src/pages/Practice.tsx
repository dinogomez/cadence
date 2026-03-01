import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'
import { CaretDown } from '@phosphor-icons/react'
import type { Persona, Scenario } from '@/types'
import { useStore } from '@/lib/store'
import { PERSONAS, SCENARIOS } from '@/lib/data'
import PersonaCard from '@/components/PersonaCard'
import ScenarioCard from '@/components/ScenarioCard'

type Tab = 'prebuilt' | 'custom'

type Preview = {
  customerName: string
  callDetails: { summary: string; situation: string; companyName: string; policyFacts: string[]; details: { label: string; value: string }[] }
} | null

export default function Practice() {
  const navigate = useNavigate()
  const {
    selectedPersona, setPersona,
    selectedScenario, setScenario,
    setCustomScenario,
    setSessionId, setVoiceId, setOpeningAudio, setOpeningLine, setCallMode, setCustomerName, setCallDetails,
  } = useStore()

  const [step, setStep] = useState(1)
  const [tab, setTab] = useState<Tab>('prebuilt')
  const [customTitle, setCustomTitle] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [customFacts, setCustomFacts] = useState('')
  const [customPersonaName, setCustomPersonaName] = useState('')
  const [customPersonaType, setCustomPersonaType] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Preview>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // Track what we last fetched a preview for so changing persona/scenario re-fetches
  const lastPreviewKey = useRef<string>('')

  const steps = ['Select Persona', 'Build Scenario', 'Confirm & Start']

  // Fetch preview whenever we enter step 3
  useEffect(() => {
    if (step !== 3 || !selectedPersona) return
    const scenarioKey = tab === 'custom' ? `custom:${customTitle}` : (selectedScenario?.id ?? '')
    const key = `${selectedPersona.id}:${scenarioKey}`
    if (key === lastPreviewKey.current) return  // already fetched for this exact selection
    lastPreviewKey.current = key
    setPreview(null)
    setPreviewLoading(true)
    const body: Record<string, unknown> = { personaId: selectedPersona.id }
    if (tab === 'custom') {
      body.customScenario = {
        title: customTitle,
        context: customContext,
        policyFacts: customFacts.split('\n').filter(Boolean),
        estimatedTurns: 8,
        ...(customPersonaName && { personaNameOverride: customPersonaName }),
        ...(customPersonaType && { personaTypeOverride: customPersonaType }),
      }
    } else {
      body.scenarioId = selectedScenario?.id
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/session/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(data => setPreview(data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false))
  }, [step, selectedPersona?.id, selectedScenario?.id, tab, customTitle])

  const handleStart = async () => {
    if (!selectedPersona) return
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        personaId: selectedPersona.id,
        agentName: 'Agent',
        // Pass pre-generated data so /start doesn't re-generate them
        ...(preview?.customerName && { customerName: preview.customerName }),
        ...(preview?.callDetails && { callDetails: preview.callDetails }),
      }
      if (tab === 'custom') {
        const custom = {
          title: customTitle,
          context: customContext,
          policyFacts: customFacts.split('\n').filter(Boolean),
          estimatedTurns: 8,
          ...(customPersonaName && { personaNameOverride: customPersonaName }),
          ...(customPersonaType && { personaTypeOverride: customPersonaType }),
        }
        body.customScenario = custom
        setCustomScenario(custom)
      } else {
        body.scenarioId = selectedScenario?.id
        setCustomScenario(null)
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setSessionId(data.sessionId)
      setVoiceId(data.voiceId ?? null)
      setOpeningAudio(data.openingAudioB64 ?? null)
      setOpeningLine(data.openingLine ?? null)
      setCallMode(data.callMode ?? 'customer-first')
      setCustomerName(data.customerName ?? null)
      setCallDetails(data.callDetails ?? null)
      navigate(`/call/${data.sessionId}`)
    } catch (err) {
      console.error('Failed to start session:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { document.title = 'Practice — Cadence' }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <main id="main-content">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <a href="/"><img src="/logo.webp" alt="Cadence" className="h-7 w-auto" /></a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((label, i) => {
            const n = i + 1
            const isActive = step === n
            const isDone = step > n
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isDone && 'bg-blue-50 text-blue-600 border border-blue-200',
                    isActive && 'bg-blue-600 text-white',
                    !isDone && !isActive && 'bg-white border border-gray-300 text-gray-400'
                  )}>
                    {isDone ? '✓' : n}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
                </div>
                {i < steps.length - 1 && <div className="w-16 h-px bg-gray-300 mx-2 mb-4" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Persona */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select a Customer Persona</h2>
            <p className="text-sm text-gray-500 mb-6">Choose the type of customer you'll practice with.</p>
            <div className="flex flex-col gap-3">
              {PERSONAS.map(p => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  selected={selectedPersona?.id === p.id}
                  onSelect={() => setPersona(p)}
                />
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                disabled={!selectedPersona}
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Scenario */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Build a Scenario</h2>
            <p className="text-sm text-gray-500 mb-6">Pick a pre-built scenario or create your own.</p>

            {/* Segmented control */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-6">
              {(['prebuilt', 'custom'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                    tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t === 'prebuilt' ? 'Pre-built' : 'Custom'}
                </button>
              ))}
            </div>

            {tab === 'prebuilt' ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {SCENARIOS.map(s => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    selected={selectedScenario?.id === s.id}
                    onSelect={() => setScenario(s)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Scenario Title</label>
                  <input
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="e.g. Late Delivery Complaint"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Customer Name <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      value={customPersonaName}
                      onChange={e => setCustomPersonaName(e.target.value)}
                      placeholder={`${selectedPersona?.name ?? 'e.g. Sarah'}`}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Customer Role <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      value={customPersonaType}
                      onChange={e => setCustomPersonaType(e.target.value)}
                      placeholder={`${selectedPersona?.type ?? 'e.g. Long-time customer'}`}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Context</label>
                  <textarea
                    value={customContext}
                    onChange={e => setCustomContext(e.target.value)}
                    placeholder="Background info for the AI customer..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Policy Facts (one per line)</label>
                  <textarea
                    value={customFacts}
                    onChange={e => setCustomFacts(e.target.value)}
                    placeholder="Return policy is 14 days&#10;Refunds take 5-7 business days&#10;..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button
                disabled={tab === 'prebuilt' ? !selectedScenario : !customTitle}
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Start */}
        {step === 3 && (
          <Step3Content
            selectedPersona={selectedPersona}
            selectedScenario={selectedScenario}
            tab={tab}
            customTitle={customTitle}
            customContext={customContext}
            customFacts={customFacts}
            preview={preview}
            previewLoading={previewLoading}
            loading={loading}
            handleStart={handleStart}
            setStep={setStep}
            onPersonaChange={(p) => { setPersona(p); lastPreviewKey.current = ''; setPreview(null) }}
            onScenarioChange={(s) => { setScenario(s); lastPreviewKey.current = ''; setPreview(null) }}
          />
        )}
      </div>
      </main>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('bg-gray-100 rounded animate-pulse', className)} />
}

function PolicyRow({ facts, loading }: { facts: string[]; loading: boolean }) {
  return (
    <div>
      {loading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ) : (
        facts.map((fact, i) => (
          <p key={i} className="text-sm text-gray-700 flex gap-2 mb-1 last:mb-0">
            <span className="text-gray-300 flex-shrink-0">—</span>
            {fact.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1')}
          </p>
        ))
      )}
    </div>
  )
}


function PersonaSelect({ value, onChange }: { value: Persona | null; onChange: (p: Persona) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const avatarUrl = useMemo(() => {
    if (!value) return ''
    const av = createAvatar(glass, { seed: value.id, size: 40, radius: 50, backgroundType: ['gradientLinear'] })
    return `data:image/svg+xml;utf8,${encodeURIComponent(av.toString())}`
  }, [value?.id])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 transition-colors"
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={value?.name} className="w-8 h-8 rounded-full flex-shrink-0" />
          : <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">{value?.avatar ?? '?'}</span>
        }
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-gray-900 text-sm">{value?.name ?? 'Select persona'}</div>
          {value && <div className="text-xs text-gray-500">{value.type}</div>}
        </div>
        <CaretDown size={14} className={clsx('text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          {PERSONAS.map(p => {
            const pAvatarUrl = (() => {
              const av = createAvatar(glass, { seed: p.id, size: 40, radius: 50, backgroundType: ['gradientLinear'] })
              return `data:image/svg+xml;utf8,${encodeURIComponent(av.toString())}`
            })()
            const isSelected = value?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-100 last:border-0',
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                )}
              >
                <img src={pAvatarUrl} alt={p.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.type}</div>
                </div>
                {isSelected && <span className="text-blue-600 text-xs font-medium flex-shrink-0">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScenarioSelect({ value, onChange, tab, customTitle }: {
  value: Scenario | null
  onChange: (s: Scenario) => void
  tab: 'prebuilt' | 'custom'
  customTitle: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayTitle = tab === 'custom' ? customTitle : (value?.title ?? 'Select scenario')
  const displaySub = tab === 'custom' ? 'Custom' : value?.difficulty ?? ''

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => { if (tab === 'prebuilt') setOpen(o => !o) }}
        className={clsx(
          'w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 transition-colors',
          tab === 'prebuilt' ? 'hover:border-gray-300 cursor-pointer' : 'cursor-default'
        )}
      >
        <span className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-base flex-shrink-0">📋</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-gray-900 text-sm truncate">{displayTitle}</div>
          {displaySub && <div className="text-xs text-gray-500">{displaySub.charAt(0).toUpperCase() + displaySub.slice(1)}</div>}
        </div>
        {tab === 'prebuilt' && (
          <CaretDown size={14} className={clsx('text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {open && tab === 'prebuilt' && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          {SCENARIOS.map(s => {
            const isSelected = value?.id === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-100 last:border-0',
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                )}
              >
                <span className="text-base flex-shrink-0">📋</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}</div>
                </div>
                {isSelected && <span className="text-blue-600 text-xs font-medium flex-shrink-0">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Step3Content({ selectedPersona, selectedScenario, tab, customTitle, customContext, customFacts, preview, previewLoading, loading, handleStart, setStep, onPersonaChange, onScenarioChange }: {
  selectedPersona: Persona | null
  selectedScenario: Scenario | null
  tab: 'prebuilt' | 'custom'
  customTitle: string
  customContext: string
  customFacts: string
  preview: Preview
  previewLoading: boolean
  loading: boolean
  handleStart: () => void
  setStep: (n: number) => void
  onPersonaChange: (p: Persona) => void
  onScenarioChange: (s: Scenario) => void
}) {
  const policyFacts = tab === 'custom'
    ? customFacts.split('\n').filter(Boolean)
    : selectedScenario?.policyFacts ?? []

  const context = tab === 'custom' ? customContext : selectedScenario?.context ?? ''

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Confirm & Start</h2>
      <p className="text-sm text-gray-500 mb-6">Review the call briefing before you begin.</p>

      {/* Persona + Scenario select row */}
      <div className="flex gap-3 mb-6">
        <PersonaSelect value={selectedPersona} onChange={onPersonaChange} />
        <ScenarioSelect value={selectedScenario} onChange={onScenarioChange} tab={tab} customTitle={customTitle} />
      </div>

      {/* Call Briefing */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Call Briefing</span>
          {previewLoading && (
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Generating scenario...
            </span>
          )}
          {!previewLoading && preview && (
            <span className="text-xs text-gray-400">{preview.callDetails.companyName}</span>
          )}
        </div>
        <div className="divide-y divide-gray-100">

          {/* Customer — generated name + details + persona behaviour */}
          <div className="px-4 py-3 flex gap-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">Customer</span>
            <div className="flex-1">
              {previewLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-full mt-2" />
                </div>
              ) : preview ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{preview.customerName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedPersona?.type}</p>
                  {preview.callDetails.details.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {preview.callDetails.details.map(d => (
                        <span key={d.label} className="text-xs text-gray-500">
                          <span className="text-gray-400">{d.label}:</span> <span className="font-medium text-gray-700">{d.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">{selectedPersona?.description}</p>
                  {selectedPersona?.traits && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedPersona.traits.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">{selectedPersona?.type}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedPersona?.description}</p>
                  {selectedPersona?.traits && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedPersona.traits.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Problem — generated summary */}
          <div className="px-4 py-3 flex gap-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">Problem</span>
            <div className="flex-1">
              {previewLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {preview?.callDetails.summary || (tab === 'custom' ? customTitle : selectedScenario?.description) || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Context — generated situation */}
          <div className="px-4 py-3 flex gap-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">Context</span>
            <div className="flex-1">
              {previewLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <p className="text-sm text-gray-700">
                  {preview?.callDetails.situation || context || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Policy */}
          <div className="px-4 py-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">Policy</span>
            <PolicyRow
              facts={preview?.callDetails.policyFacts ?? policyFacts}
              loading={previewLoading}
            />
          </div>

        </div>
      </div>

      {/* Scoring dimensions */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['Empathy', 'English', 'Compliance', 'Resolution'].map(d => (
          <span key={d} className="bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-1">{d}</span>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <button
          disabled={loading || previewLoading}
          onClick={handleStart}
          className="w-48 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Starting...' : previewLoading ? 'Preparing...' : 'Start Call →'}
        </button>
      </div>
    </div>
  )
}
