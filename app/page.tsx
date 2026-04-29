'use client'

import { useState, useEffect } from 'react'
import Chat from '@/components/Chat'
import Workspace from '@/components/Workspace'
import { IdeaCard } from '@/lib/types'

const STORAGE_KEY = 'kanishka_ideas'

export default function Home() {
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'workspace'>('chat')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setIdeas(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const saveIdea = (content: string, seed: string, format: IdeaCard['format']) => {
    const newIdea: IdeaCard = {
      id: Date.now().toString(),
      seed,
      content,
      preview: content.slice(0, 140).trim() + (content.length > 140 ? '...' : ''),
      format,
      tags: [],
      createdAt: new Date().toISOString(),
    }

    setIdeas((prev) => {
      const updated = [newIdea, ...prev]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore storage errors
      }
      return updated
    })
  }

  const deleteIdea = (id: string) => {
    setIdeas((prev) => {
      const updated = prev.filter((i) => i.id !== id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-medium text-sm tracking-wide">kanishka.</h1>
          <p className="text-muted text-xs opacity-60">content engine</p>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex md:hidden items-center gap-2">
        <a href="/rhythm" className="text-muted text-xs opacity-30 hover:text-accent hover:opacity-80 transition-colors px-1">♩</a>
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-accent text-background font-medium'
                : 'text-muted hover:text-text-primary'
            }`}
          >
            Research
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === 'workspace'
                ? 'bg-accent text-background font-medium'
                : 'text-muted hover:text-text-primary'
            }`}
          >
            Ideas {ideas.length > 0 && `(${ideas.length})`}
          </button>
        </div>
        </div>

        {/* Desktop idea count + rhythm link */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/rhythm"
            className="text-xs text-muted opacity-40 hover:text-accent hover:opacity-100 transition-colors"
          >
            ♩ rhythm
          </a>
          <span className="text-muted text-xs opacity-50">
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} saved
          </span>
        </div>
      </header>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div
          className={`
            flex-1 md:flex-none md:w-[46%] border-r border-border overflow-hidden flex flex-col
            ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
          `}
        >
          <Chat onSaveIdea={saveIdea} />
        </div>

        {/* Workspace panel */}
        <div
          className={`
            flex-1 overflow-hidden flex flex-col
            ${activeTab === 'workspace' ? 'flex' : 'hidden md:flex'}
          `}
        >
          <Workspace ideas={ideas} onDelete={deleteIdea} />
        </div>
      </div>
    </main>
  )
}
