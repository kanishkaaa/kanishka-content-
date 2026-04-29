'use client'

import { ElementId, ElementLayer } from '@/lib/rhythmTypes'
import { synthProfiles } from '@/lib/synthProfiles'
import ElementLayerRow from './ElementLayer'

const ELEMENT_IDS = Object.keys(synthProfiles) as ElementId[]

interface ElementMixerProps {
  layers: ElementLayer[]
  onAdd: (id: ElementId) => void
  onRemove: (instanceId: string) => void
  onVolumeChange: (instanceId: string, v: number) => void
  onPanChange: (instanceId: string, p: number) => void
}

export default function ElementMixer({ layers, onAdd, onRemove, onVolumeChange, onPanChange }: ElementMixerProps) {
  const activeIds = new Set(layers.map(l => l.elementId))

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* palette */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ELEMENT_IDS.map(id => {
          const profile = synthProfiles[id]
          const isActive = activeIds.has(id)
          return (
            <button
              key={id}
              onClick={() => onAdd(id)}
              className={`
                flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all
                ${isActive
                  ? 'border-accent/40 bg-accent/5 text-text-primary'
                  : 'border-border bg-surface text-muted hover:border-accent/20 hover:text-text-primary'}
              `}
            >
              <span className="text-xl leading-none">{profile.emoji}</span>
              <span className="text-[10px] leading-tight opacity-70">{profile.label}</span>
            </button>
          )
        })}
      </div>

      {/* active layers */}
      <div className="flex flex-col gap-1.5">
        {layers.length === 0 ? (
          <p className="text-muted text-xs opacity-30 italic text-center py-4">
            tap an element above to begin
          </p>
        ) : (
          layers.map(layer => (
            <ElementLayerRow
              key={layer.id}
              layer={layer}
              onRemove={() => onRemove(layer.id)}
              onVolumeChange={v => onVolumeChange(layer.id, v)}
              onPanChange={p => onPanChange(layer.id, p)}
            />
          ))
        )}
      </div>
    </div>
  )
}
