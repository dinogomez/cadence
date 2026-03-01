import { useEffect, useRef } from 'react'

interface Props { score: number; size?: number }

export default function ScoreRing({ score, size = 96 }: Props) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius

  const color = score >= 4 ? '#16a34a' : score >= 3 ? '#ca8a04' : score >= 2 ? '#f97316' : '#dc2626'

  useEffect(() => {
    if (!circleRef.current) return
    const offset = circumference * (1 - score / 5)
    circleRef.current.style.strokeDashoffset = String(circumference)
    requestAnimationFrame(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dashoffset 1s ease'
        circleRef.current.style.strokeDashoffset = String(offset)
      }
    })
  }, [score, circumference])

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle
        ref={circleRef}
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        fontSize={size / 4} fontWeight="600" fill="#111827">
        {score.toFixed(1)}
      </text>
    </svg>
  )
}
