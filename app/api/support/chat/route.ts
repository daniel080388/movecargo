import { NextResponse } from 'next/server'
import faqs from '@/data/support-faq.json'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import prisma from '@/lib/prisma'
// Minimal Redis interface so we don't require ioredis types at build time
type RedisType = { incr: (key: string) => Promise<number>; pexpire: (key: string, ms: number) => Promise<number> }

// Rate limit config (override via env for tests/ops)
const RATE_LIMIT = parseInt(process.env.SUPPORT_RATE_LIMIT || '20', 10) // requests
const RATE_WINDOW_MS = parseInt(process.env.SUPPORT_RATE_WINDOW_MS || String(60 * 1000), 10) // 1 minute

// Optional Redis client (if REDIS_URL present); fallback to in-memory map
let redis: RedisType | null = null
function getRedis(): RedisType | null {
  try {
    if (redis) return redis
    const url = process.env.REDIS_URL
    if (!url) return null
  // Lazy import to avoid bundling; use eval to prevent static analysis
  // eslint-disable-next-line no-eval
  const IORedis = eval("require")('ioredis')
    // construct without types
    redis = new IORedis(url) as RedisType
    return redis
  } catch {
    return null
  }
}

// Simple in-memory fallback limiter
const rateMap: Map<string, { count: number; resetAt: number }> = new Map()

async function isAllowed(ip: string): Promise<boolean> {
  const r = getRedis()
  const nowMs = now()
  if (r) {
    const bucket = Math.floor(nowMs / RATE_WINDOW_MS)
    const key = `rate:support:${ip}:${bucket}`
    try {
      const count = await r.incr(key)
      if (count === 1) {
        // set TTL on first increment
        await r.pexpire(key, RATE_WINDOW_MS)
      }
      return count <= RATE_LIMIT
    } catch {
      // fallback to memory on redis error
    }
  }
  // In-memory fallback
  const entry = rateMap.get(ip) || { count: 0, resetAt: nowMs + RATE_WINDOW_MS }
  if (nowMs > entry.resetAt) { entry.count = 0; entry.resetAt = nowMs + RATE_WINDOW_MS }
  entry.count += 1
  rateMap.set(ip, entry)
  return entry.count <= RATE_LIMIT
}

const dataDir = path.join(process.cwd(), 'data')
const embeddingsPath = path.join(dataDir, 'support-faq-embeddings.json')
const convPath = path.join(dataDir, 'support-conversations.json')

function now() { return Date.now() }

async function ensureFaqEmbeddings() {
  // If file exists, return parsed cache
  try {
    if (fs.existsSync(embeddingsPath)) {
      const raw = fs.readFileSync(embeddingsPath, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (e) {
    // ignore
  }

  // If no OpenAI key, return null
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  // compute embeddings for each FAQ and persist
  const texts = (faqs as any[]).map((f) => f.question + '\n' + (f.answer || ''))
  try {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
    })
    const data: any = await resp.json()
    const embeddings = (data?.data || []).map((d: any, i: number) => ({ id: (faqs as any[])[i].id, vector: d.embedding }))
    try { fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2)) } catch (e) { /* ignore */ }
    return embeddings
  } catch (e) {
    return null
  }
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12)
}

async function faqByEmbedding(message: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  let cache = null
  try { cache = fs.existsSync(embeddingsPath) ? JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8')) : null } catch (e) { cache = null }
  if (!cache) cache = await ensureFaqEmbeddings()
  if (!cache) return null

  // get embedding for message
  try {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
    })
    const data: any = await resp.json()
    const emb = data?.data?.[0]?.embedding
    if (!emb) return null
    // compute best match (and allow a slightly lower threshold, combined with token overlap later)
    let best: { score: number; id: string } | null = null
    for (const e of cache) {
      const score = cosine(emb, e.vector)
      if (!best || score > best.score) best = { score, id: e.id }
    }
    if (best && best.score > 0.65) {
      const f = (faqs as any[]).find((x) => x.id === best!.id)
      return f?.answer || null
    }
  } catch (e) {
    return null
  }
  return null
}

// Text normalization helpers for better keyword matching (remove diacritics, lower-case)
function normalizeText(s: string) {
  return s
    .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .trim()
}

function tokenOverlap(a: string, b: string) {
  const sa = new Set(normalizeText(a).split(/\s+/))
  const sb = new Set(normalizeText(b).split(/\s+/))
  if (sa.size === 0 || sb.size === 0) return 0
  let common = 0
  for (const t of sa) if (sb.has(t)) common++
  return common / Math.max(sa.size, sb.size)
}

async function appendConversation(sessionId: string, message: { from: string; text: string }) {
  // Try to persist to DB first
  try {
    // find or create conversation
    const p: any = prisma as any
    let conv = await p.supportConversation.findUnique({ where: { sessionId } })
    if (!conv) {
      conv = await p.supportConversation.create({ data: { sessionId } })
    }
    await p.supportMessage.create({ data: { conversationId: conv.id, role: message.from || 'user', text: message.text } })
    return
  } catch (e) {
    // fall through to file fallback
  }

  try {
    const store: Record<string, any[]> = fs.existsSync(convPath) ? JSON.parse(fs.readFileSync(convPath, 'utf-8')) as Record<string, any[]> : {}
    if (!store[sessionId]) store[sessionId] = []
    store[sessionId].push({ ...message, at: new Date().toISOString() })
    fs.writeFileSync(convPath, JSON.stringify(store, null, 2))
  } catch (e) {
    // ignore
  }
}

export async function POST(req: Request) {
  try {
  // rate limit by ip (Redis if available, else in-memory)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local'
  const ok = await isAllowed(Array.isArray(ip) ? ip[0] : String(ip))
  if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json()
    const { message, sessionId: incomingSessionId } = body
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const sessionId = incomingSessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`

    // persist user message
    appendConversation(sessionId, { from: 'user', text: message })

    // try embedding-based FAQ match first
    const embedReply = await faqByEmbedding(message)
    if (embedReply) {
      appendConversation(sessionId, { from: 'bot', text: embedReply })
      return NextResponse.json({ reply: embedReply, sessionId })
    }

    // fallback improved keyword/semantic-lite matching using normalization + token overlap
    const normMsg = normalizeText(message)
    let bestFaq: any = null
    let bestScore = 0
    for (const f of faqs as any[]) {
      const text = `${f.question || ''} ${f.answer || ''}`
      const score = tokenOverlap(normMsg, text)
      if (score > bestScore) { bestScore = score; bestFaq = f }
    }
    // choose an answer if overlap is reasonable (e.g., > 0.3), otherwise try a simple substring fallback
    if (bestFaq && bestScore >= 0.3) {
      appendConversation(sessionId, { from: 'bot', text: bestFaq.answer })
      return NextResponse.json({ reply: bestFaq.answer, sessionId })
    } else {
      // simple substring fallback on normalized strings
      for (const f of faqs as any[]) {
        const qn = normalizeText(f.question || '')
        if (qn && (qn.includes(normMsg) || normMsg.includes(qn))) {
          appendConversation(sessionId, { from: 'bot', text: f.answer })
          return NextResponse.json({ reply: f.answer, sessionId })
        }
      }
    }

    // fallback to OpenAI chat if available
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      const prompt = `You are a helpful assistant for Movecargo. User asked: ${message}`
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 300 }),
      })
      const data: any = await resp.json()
      const reply = (data && data.choices && data.choices[0] && (data.choices[0].message?.content || data.choices[0].text)) || 'Desculpe, não consegui gerar uma resposta.'
      appendConversation(sessionId, { from: 'bot', text: reply })
      return NextResponse.json({ reply, sessionId })
    }

    const fallback = 'Obrigado pela pergunta — iremos responder em breve. Veja as FAQ: ' + (faqs as any[]).map((f) => f.question).join('; ')
    appendConversation(sessionId, { from: 'bot', text: fallback })
    return NextResponse.json({ reply: fallback, sessionId })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { sessionId } = body || {}
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    // Try DB first
    try {
      const p: any = prisma as any
      const conv = await p.supportConversation.findUnique({ where: { sessionId } })
      if (conv) {
        // delete messages then conversation (onDelete cascade if configured; otherwise manual)
        await p.supportMessage.deleteMany({ where: { conversationId: conv.id } })
        await p.supportConversation.delete({ where: { id: conv.id } })
      }
    } catch (e) {
      // ignore and try file fallback
    }

    // File fallback
    try {
      if (fs.existsSync(convPath)) {
        const store = JSON.parse(fs.readFileSync(convPath, 'utf-8')) as Record<string, any[]>
        if (store[sessionId]) {
          delete store[sessionId]
          fs.writeFileSync(convPath, JSON.stringify(store, null, 2))
        }
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId') || ''
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    // Try DB first
    try {
      const p: any = prisma as any
      const conv = await p.supportConversation.findUnique({
        where: { sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (conv) {
        const messages = (conv.messages || []).map((m: any) => ({ from: m.role === 'system' ? 'bot' : m.role, text: m.text, at: new Date(m.createdAt).toISOString() }))
        return NextResponse.json({ sessionId, messages })
      }
    } catch (e) {
      // ignore, fallback to file store
    }

    // Fallback file store
    try {
      if (fs.existsSync(convPath)) {
        const store = JSON.parse(fs.readFileSync(convPath, 'utf-8')) as Record<string, any[]>
        const arr = store[sessionId] || []
        const messages = arr.map((m: any) => ({ from: m.from || 'user', text: m.text || '', at: m.at || new Date().toISOString() }))
        return NextResponse.json({ sessionId, messages })
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ sessionId, messages: [] })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
