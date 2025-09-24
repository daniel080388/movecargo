"use client"
import React, { useEffect, useRef, useState } from 'react'

type Msg = { from: 'user' | 'bot'; text: string; at?: string }

const STORAGE_KEY = 'movecargo_support_session'

export default function SupportChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [clearing, setClearing] = useState(false)
  const [hydrating, setHydrating] = useState(false)

  // load persisted session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.sessionId) setSessionId(parsed.sessionId)
        if (Array.isArray(parsed?.messages)) setMessages(parsed.messages)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    // persist messages + sessionId
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }))
    } catch (e) {}
    // scroll to bottom
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, sessionId])

  // hydrate from server when sessionId is known
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    ;(async () => {
      try {
        setHydrating(true)
        const res = await fetch(`/api/support/chat?sessionId=${encodeURIComponent(sessionId)}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages)
        }
      } catch {}
      finally {
        if (!cancelled) setHydrating(false)
      }
    })()
    return () => { cancelled = true }
  }, [sessionId])

  async function send() {
    if (!input.trim()) return
    const userMsg = input.trim()
    const userObj: Msg = { from: 'user', text: userMsg, at: new Date().toISOString() }
    setMessages((m) => [...m, userObj])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/support/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, sessionId }) })
      const data = await res.json()
      const botMsg: Msg = { from: 'bot', text: data.reply || data.error || 'Erro', at: new Date().toISOString() }
      setMessages((m) => [...m, botMsg])
      if (data.sessionId) setSessionId(data.sessionId)
    } catch (err: any) {
      setMessages((m) => [...m, { from: 'bot', text: 'Erro: ' + String(err), at: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  async function clearSession() {
    setClearing(true)
    try {
      // clear local first for snappy UI
      setMessages([])
      const old = sessionId
      setSessionId(null)
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      if (old) {
        await fetch('/api/support/chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: old }) })
      }
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-4 border rounded max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">Sessão: {sessionId || 'nova'}</div>
        <button onClick={clearSession} className="text-sm text-red-600 hover:underline" disabled={clearing}>
          {clearing ? 'A limpar...' : 'Limpar sessão'}
        </button>
      </div>

      <div ref={listRef} className="space-y-3 mb-3 max-h-96 overflow-auto">
        {messages.length === 0 && !loading && (
          <div className="text-sm text-gray-400">Sem mensagens. Escreve algo abaixo para começar.</div>
        )}
        {hydrating && (
          <div className="text-xs text-gray-400">A sincronizar histórico…</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">AI</div>
            )}
            <div className={`max-w-[75%] p-2 rounded ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {m.text}
              <div className="text-[10px] opacity-70 mt-1">{m.at ? new Date(m.at).toLocaleTimeString() : ''}</div>
            </div>
            {m.from === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700">TU</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border p-2" placeholder="Escreve a tua mensagem..." onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}>{loading ? 'A processar...' : 'Enviar'}</button>
      </div>
    </div>
  )
}
