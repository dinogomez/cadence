import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import ScoreRing from '@/components/ScoreRing'
import ScoreBar from '@/components/ScoreBar'

const OUTCOME_BADGE = {
  resolved: 'bg-green-50 text-green-700',
  unresolved: 'bg-red-50 text-red-700',
  escalated: 'bg-yellow-50 text-yellow-700',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className ?? ''}`} />
}

function ScorePill({ score }: { score: number }) {
  const cls = score >= 4 ? 'bg-green-50 text-green-700'
    : score >= 3 ? 'bg-yellow-50 text-yellow-700'
    : score >= 2 ? 'bg-orange-50 text-orange-700'
    : 'bg-red-50 text-red-700'
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cls}`}>{score.toFixed(1)}</span>
}

export default function Assessment() {
  const navigate = useNavigate()
  const { scorecard, scorecardLoading, turnEvaluations, agentName, selectedScenario, reset } = useStore()
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // No data at all — redirect
  if (!scorecard && !scorecardLoading) {
    navigate('/practice', { replace: true })
    return null
  }

  const loading = scorecardLoading && !scorecard

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/practice" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← New Session</Link>
          <Link to="/"><img src="/logo.webp" alt="Cadence" className="h-7 w-auto" /></Link>
          <button
            onClick={() => { reset(); navigate('/practice') }}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Practice Again
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-5 w-20" />
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-gray-900">{scorecard!.agentName || agentName}</h1>
                <p className="text-sm text-gray-500 mt-1">{scorecard!.scenarioTitle || selectedScenario?.title}</p>
                <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${OUTCOME_BADGE[scorecard!.outcome]}`}>
                  {scorecard!.outcome}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col items-center">
            {loading ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <>
                <ScoreRing score={scorecard!.overallScore} size={96} />
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-semibold text-gray-900">{scorecard!.overallScore.toFixed(1)}</span>
                  <span className="text-xl text-gray-400">/ 5.0</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric row */}
      <div className="border-y border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            {['Empathy', 'English', 'Compliance', 'Resolution'].map((label, i) => {
              const values = scorecard ? [scorecard.scoreEmpathy, scorecard.scoreEnglish, scorecard.scoreCompliance, scorecard.scoreResolution] : []
              return (
                <div key={label} className="px-4 first:pl-0 last:pr-0 text-center">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
                  {loading
                    ? <Skeleton className="h-8 w-12 mx-auto mt-1" />
                    : <div className="text-3xl font-semibold text-gray-900 mb-1">{values[i].toFixed(1)}</div>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="max-w-3xl mx-auto px-6 py-6 border-b border-gray-100">
        {loading ? (
          <div className="space-y-4">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : (
          <>
            <ScoreBar label="Empathy"    score={scorecard!.scoreEmpathy}    delay={0} />
            <ScoreBar label="English"    score={scorecard!.scoreEnglish}    delay={100} />
            <ScoreBar label="Compliance" score={scorecard!.scoreCompliance} delay={200} />
            <ScoreBar label="Resolution" score={scorecard!.scoreResolution} delay={300} />
          </>
        )}
      </div>

      {/* Strengths / Improvements / Training */}
      <div className="max-w-3xl mx-auto px-6 py-6 border-b border-gray-100 grid grid-cols-1 gap-8">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : (
          [
            { title: 'Strengths', items: scorecard!.strengths, dot: 'bg-green-500' },
            { title: 'Areas for Improvement', items: scorecard!.areasForImprovement, dot: 'bg-yellow-400' },
            { title: 'Recommended Training', items: scorecard!.recommendedTraining, dot: 'bg-blue-500' },
          ].map(({ title, items, dot }) => (
            <div key={title}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
              <ul>
                {items.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 py-1.5 border-b border-gray-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full ${dot} mt-1.5 flex-shrink-0`} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Turn table */}
      {turnEvaluations.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 mt-6">Turn-by-Turn Review</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Turn', 'Agent Response', 'Emp', 'Eng', 'Comp', 'Res', 'Coaching Tip'].map(col => (
                  <th key={col} className="text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 text-left pr-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {turnEvaluations.map((t, i) => (
                <>
                  <tr key={i} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                    <td className="py-2.5 pr-3 text-gray-500">{t.turnNumber}</td>
                    <td className="py-2.5 pr-3 max-w-xs"><span className="truncate block text-gray-900">{t.agentText}</span></td>
                    {[t.scoreEmpathy, t.scoreEnglish, t.scoreCompliance, t.scoreResolution].map((score, si) => (
                      <td key={si} className="py-2.5 pr-3"><ScorePill score={score} /></td>
                    ))}
                    <td className="py-2.5 text-gray-500 text-xs max-w-xs">
                      <span className="truncate block">{t.coachingTip}</span>
                    </td>
                  </tr>
                  {expandedRow === i && (
                    <tr key={`${i}-expanded`} className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={7} className="px-3 py-3">
                        <p className="text-sm text-gray-700">{t.agentText}</p>
                        {t.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.flags.map((f, fi) => (
                              <span key={fi} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-blue-600 mt-2">Tip: {t.coachingTip}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
