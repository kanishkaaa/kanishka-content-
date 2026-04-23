import Groq from 'groq-sdk'
import { SYSTEM_PROMPT } from '@/lib/prompts'

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
  try {
    const { messages, searchContext } = await req.json()

    const system =
      SYSTEM_PROMPT +
      (searchContext
        ? `\n\n---\nRELEVANT RESEARCH (from live web search):\n${searchContext}\n\nUse this research to validate, enrich, or fact-check your response.`
        : '')

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
