'use client'

import React from 'react'
import { ElementLayer as ElementLayerType } from '@/lib/rhythmTypes'
import { synthProfiles } from '@/lib/synthProfiles'

interface ElementLayerProps {
  layer: ElementLayerType
  onRemove: () => void
  onVolumeChange: (v: number) => void
  onPanChange: (p: number) => void
}

export default function ElementLayerRow({ layer, onRemove, onVolumeChange, onPanChange }: ElementLayerProps) {
  const profile = synthProfiles[layer.elementId]

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface group">
      <span className="text-base w-6 text-center flex-shrink-0">{profile.emoji}</span>
      <span className="text-xs text-text-primary w-16 flex-shrink-0">{profile.label}</span>

      {/* volume slider */}
      <div className="flex-1 flex items-center gap-1.5">
        <span className="text-muted text-[10px] opacity-50 flex-shrink-0">vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layer.volume}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 accent-accent h-1 cursor-pointer"
          style={{ accentColor: '#d4a96a' }}
        />
      </div>

      {/* pan slider */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-muted text-[10px] opacity-50">L</span>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.05}
          value={layer.pan}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPanChange(parseFloat(e.target.value))}
          className="w-16 h-1 cursor-pointer"
          style={{ accentColor: '#d4a96a' }}
        />
        <span className="text-muted text-[10px] opacity-50">R</span>
      </div>

      <button
        onClick={onRemove}
        className="text-muted opacity-40 hover:opacity-80 hover:text-text-primary transition-opacity flex-shrink-0 text-sm leading-none"
        aria-label="Remove layer"
      >
        ×
      </button>
    </div>
  )
}
