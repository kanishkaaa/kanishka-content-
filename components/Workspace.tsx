'use client'

import { useState } from 'react'
import { IdeaCard as IdeaCardType } from '@/lib/types'
import IdeaCard from './IdeaCard'

interface WorkspaceProps {
  ideas: IdeaCardType[]
  onDelete: (id: string) => void
}

const FILTERS = ['all', 'video', 'carousel', 'post', 'raw']

export default function Workspace({ ideas, onDelete }: WorkspaceProps) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filter === 'all' ? ideas : ideas.filter((i) => i.format === filter)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary text-xs font-medium tracking-widest uppercase opacity-50">
            Workspace
          </h2>
          <span className="text-muted text-xs">
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                filter === f
                  ? 'border-accent/60 text-accent bg-accent/10'
                  : 'border-border text-muted hover:border-muted/40 hover:text-text-primary/60'
              }`}
            >
              {f === 'raw' ? 'research' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center mb-4 opacity-40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="#6e6a64"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-muted text-sm">
              {ideas.length === 0
                ? 'No ideas yet.'
                : 'Nothing in this category.'}
            </p>
            <p className="text-muted/60 text-xs mt-1.5 leading-relaxed">
              {ideas.length === 0
                ? 'Drop a seed in the chat and save what resonates.'
                : 'Switch filters or save more ideas.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isExpanded={expanded === idea.id}
                onToggle={() => setExpanded(expanded === idea.id ? null : idea.id)}
                onDelete={() => onDelete(idea.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
