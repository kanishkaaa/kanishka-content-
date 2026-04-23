'use client'

import { useState } from 'react'
import { IdeaCard as IdeaCardType } from '@/lib/types'

interface IdeaCardProps {
  idea: IdeaCardType
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}

const FORMAT_LABELS: Record<string, string> = {
  video: 'Video',
  carousel: 'Carousel',
  post: 'Post',
  raw: 'Research',
}

export default function IdeaCard({ idea, isExpanded, onToggle, onDelete }: IdeaCardProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(idea.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="border border-border rounded-2xl bg-surface overflow-hidden transition-all duration-200">
      <div
        className="px-4 py-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.015] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-accent/70 font-medium">
              {FORMAT_LABELS[idea.format] ?? 'Research'}
            </span>
          </div>
          <p className="text-text-primary text-sm font-medium leading-snug truncate">
            {idea.seed}
          </p>
          {!isExpanded && (
            <p className="text-muted text-xs mt-1 line-clamp-2 leading-relaxed">
              {idea.preview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
          <span className="text-muted text-xs">{formatDate(idea.createdAt)}</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-border pt-3 mb-4">
            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {idea.content}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="px-3 py-1.5 text-xs border border-border rounded-xl text-muted hover:text-text-primary hover:border-muted/50 transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="px-3 py-1.5 text-xs border border-border rounded-xl text-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
