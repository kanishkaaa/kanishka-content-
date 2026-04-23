import { SearchResult } from '@/lib/types'

export async function POST(req: Request) {
  const { query } = await req.json()

  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) {
    return Response.json({ results: [] })
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_raw_content: false,
      }),
    })

    const data = await res.json()
    const results: SearchResult[] = (data.results || []).map((r: SearchResult) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }))

    return Response.json({ results })
  } catch (err) {
    console.error('Search error:', err)
    return Response.json({ results: [] })
  }
}
