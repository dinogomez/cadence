import { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'
import type { Persona } from '@/types'

interface Props { persona: Persona; selected: boolean; onSelect: () => void }

const TYPE_COLORS: Record<string, string> = {
  'Frustrated Customer': 'bg-red-50 text-red-600',
  'Confused Elderly':    'bg-purple-50 text-purple-600',
  'Cancellation Intent': 'bg-amber-50 text-amber-600',
  'Technical Support':   'bg-blue-50 text-blue-600',
  'High-Value Customer': 'bg-indigo-50 text-indigo-600',
  'New Customer':        'bg-green-50 text-green-600',
  'Hostile Customer':    'bg-orange-50 text-orange-600',
  'ESL Customer':        'bg-teal-50 text-teal-600',
}


export default function PersonaCard({ persona, selected, onSelect }: Props) {
  const avatarUrl = useMemo(() => {
    const avatar = createAvatar(glass, {
      seed: persona.id,
      size: 40,
      radius: 50,
      backgroundType: ['gradientLinear'],
    })
    const svg = avatar.toString()
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [persona.id])

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white border rounded-lg p-4 cursor-pointer transition-all duration-150 flex items-center gap-4 ${
        selected ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 text-blue-600 text-sm font-medium">✓</span>
      )}
      <img src={avatarUrl} alt={persona.name} className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900">{persona.name}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[persona.type] ?? 'bg-gray-100 text-gray-600'}`}>
            {persona.type}
          </span>
        </div>
        <p className="text-sm text-gray-500">{persona.description}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {persona.traits.map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
