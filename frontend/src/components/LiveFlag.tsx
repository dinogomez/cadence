interface Props {
  type: 'warning' | 'success' | 'info'
  message: string
  turn: number
}

const STYLE = {
  warning: { border: 'border-l-red-400', icon: '⚠️' },
  success: { border: 'border-l-green-500', icon: '✓' },
  info: { border: 'border-l-blue-400', icon: '💡' },
}

export default function LiveFlag({ type, message, turn }: Props) {
  const s = STYLE[type]
  return (
    <div className={`bg-white border border-gray-200 border-l-2 ${s.border} rounded-lg p-3 text-sm animate-slide-up mb-2`}>
      <div className="flex items-start gap-2">
        <span className="text-base leading-none">{s.icon}</span>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Turn {turn}</span>
          <span className="text-gray-700">{message}</span>
        </div>
      </div>
    </div>
  )
}
