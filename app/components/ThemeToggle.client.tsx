"use client"

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = saved ? saved === 'dark' : prefersDark
    setDark(initialDark)
    const root = document.documentElement
    if (initialDark) root.classList.add('dark'); else root.classList.remove('dark')
  }, [])

  if (!mounted) return null

  const toggle = () => {
    const next = !dark
    setDark(next)
    const root = document.documentElement
    if (next) { root.classList.add('dark'); localStorage.setItem('theme', 'dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light') }
  }

  return (
    <button onClick={toggle} aria-label="Alternar tema" className="btn btn-outline" title="Alternar tema">
      {dark ? '🌙' : '☀️'}
    </button>
  )
}
