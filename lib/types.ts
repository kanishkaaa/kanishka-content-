export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface IdeaCard {
  id: string
  seed: string
  content: string
  preview: string
  format: 'video' | 'carousel' | 'post' | 'raw'
  tags: string[]
  createdAt: string
}

export interface SearchResult {
  title: string
  url: string
  content: string
}
