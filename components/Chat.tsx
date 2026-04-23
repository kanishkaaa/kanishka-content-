'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Message, IdeaCard } from '@/lib/types'

interface ChatProps {
  onSaveIdea: (content: string, seed: string, format: IdeaCard['format']) => void
}

const RESEARCH_KEYWORDS =
  /validate|research|study|studies|evidence|fact|proven|data|science|found that|shows that|suggest that|according to/i

const SEED_PLACEHOLDER = [
  'Drop a seed — a thing, a feeling, a claim...',
  'What are you sitting with today?',
  'Give me something to work with.',
  'A plant, an animal, a behavior, a thought...',
]

function extractSeed(content: string): string {
  const firstLine = content.split('\n')[0].trim()
  return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine
}

function detectFormat(content: string): IdeaCard['format'] {
  const lower = content.toLowerCase()
  if (lower.includes('video script') || lower.includes('spoken')) return 'video'
  if (lower.includes('carousel') || lower.includes('slide')) return 'carousel'
  if (lower.includes('caption') || lower.includes('post')) return 'post'
  return 'raw'
}

export default function Chat({ onSaveIdea }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey Kanishka. What's the seed today?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [placeholder] = useState(
    () => SEED_PLACEHOLDER[Math.floor(Math.random() * SEED_PLACEHOLDER.length)]
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      let searchContext = ''

      if (RESEARCH_KEYWORDS.test(text)) {
        try {
          const searchRes = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text }),
          })
          const { results } = await searchRes.json()
          if (results?.length) {
            searchContext = results
              .slice(0, 3)
              .map((r: { title: string; content: string }) => `${r.title}: ${r.content}`)
              .join('\n\n')
          }
        } catch {
          // search failed silently, continue without it
        }
      }

      const apiMessages = history.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, searchContext }),
      })

      if (!response.ok || !response.body) throw new Error('Request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamingContent(full)
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: full,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setStreamingContent('')
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Something went wrong. Try again.',
          timestamp: new Date().toISOString(),
        },
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSave = (msg: Message) => {
    const format = detectFormat(msg.content)
    const seed = extractSeed(msg.content)
    onSaveIdea(msg.content, seed, format)
    setSavedIds((prev) => new Set(prev).add(msg.id))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' ? (
              <div className="group max-w-[88%]">
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
                {msg.id !== '0' && (
                  <button
                    onClick={() => handleSave(msg)}
                    disabled={savedIds.has(msg.id)}
                    className="mt-1.5 ml-2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-accent disabled:text-accent disabled:opacity-100"
                  >
                    {savedIds.has(msg.id) ? '✓ Saved to workspace' : '+ Save to workspace'}
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] bg-user-bg border border-user-border rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[88%] bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              {streamingContent ? (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {streamingContent}
                  <span className="animate-pulse text-accent">▋</span>
                </p>
              ) : (
                <div className="flex gap-1.5 items-center h-5">
                  <span
                    className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex items-end gap-3 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-muted/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              resizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent text-text-primary placeholder-muted/60 text-sm resize-none outline-none leading-relaxed"
            style={{ maxHeight: '128px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 bg-accent rounded-xl flex items-center justify-center disabled:opacity-25 transition-opacity hover:opacity-80 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13"
                stroke="#070707"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="#070707"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted/40 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
