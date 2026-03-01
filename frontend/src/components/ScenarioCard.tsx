import type { Scenario } from '@/types'

interface Props { scenario: Scenario; selected: boolean; onSelect: () => void }

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  hard: 'bg-red-50 text-red-700',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function ScenarioCard({ scenario, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-white border-b cursor-pointer transition-all duration-150 px-4 py-4 flex items-center gap-4 ${
        selected ? 'border-l-2 border-l-gray-900 border-b-gray-200 bg-gray-50' : 'border-b-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-gray-900 text-sm">{scenario.title}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${DIFFICULTY_STYLE[scenario.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
            {DIFFICULTY_LABEL[scenario.difficulty] ?? scenario.difficulty}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{scenario.description}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-400">~{scenario.estimatedTurns} turns</span>
        {selected && <span className="text-gray-900 text-sm">✓</span>}
      </div>
    </div>
  )
}
