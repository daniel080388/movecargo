"use client"

import { useLocale } from 'next-intl'
import { LinkButton } from './ui/Button'

export default function AuthCta() {
  const seg = useLocale() || 'pt'
  return (
    <div className="flex items-center gap-2">
      <LinkButton href={`/${seg}/login`} variant="outline">Login</LinkButton>
      <LinkButton href={`/${seg}/registrar`} variant="primary">Registrar</LinkButton>
    </div>
  )
}
