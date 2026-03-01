import { useEffect, useRef } from 'react'

interface Props { label: string; score: number; delay?: number }

export default function ScoreBar({ label, score, delay = 0 }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-400' : score >= 2 ? 'bg-orange-400' : 'bg-red-500'

  useEffect(() => {
    if (!barRef.current) return
    barRef.current.style.width = '0%'
    const t = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.transition = 'width 0.8s ease'
        barRef.current.style.width = `${(score / 5) * 100}%`
      }
    }, delay)
    return () => clearTimeout(t)
  }, [score, delay])

  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-sm text-gray-600 w-28">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div ref={barRef} className={`h-full ${color} rounded-full`} style={{ width: 0 }} />
      </div>
      <span className="text-sm font-medium text-gray-900 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  )
}
