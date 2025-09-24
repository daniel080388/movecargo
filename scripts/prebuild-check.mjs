#!/usr/bin/env node
/**
 * Fail-fast check for required environment variables during build.
 * - Em Vercel: exige DATABASE_URL nas Environment Variables (não lê ficheiros .env).
 * - Em local: tenta carregar .env.local/.env antes de verificar.
 */

import fs from 'node:fs';
import path from 'node:path';

function loadEnvFileIfExists(filename) {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// Only attempt to load .env files locally. On Vercel, rely on configured env vars.
if (!process.env.VERCEL) {
  // Precedence: .env.local, then .env
  loadEnvFileIfExists('.env.local');
  loadEnvFileIfExists('.env');
}

const required = ['DATABASE_URL'];
const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length) {
  console.error('\n[BUILD CONFIG ERROR] Variáveis de ambiente em falta:', missing.join(', '));
  console.error('Em Vercel: defina-as em Project → Settings → Environment Variables (Production/Preview).');
  console.error('Em local: adicione-as em .env.local ou exporte no ambiente da shell.');
  console.error('Nota: o script de build executa "prisma migrate deploy" que exige DATABASE_URL.');
  process.exit(1);
}

// Extra: bloquear DATABASE_URL que aponte para localhost/127.*/::1 em CI/Vercel
if ((process.env.VERCEL || process.env.CI) && process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const lower = url.toLowerCase();
  if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('::1')) {
    console.error('\n[BUILD CONFIG ERROR] Em Vercel/CI, DATABASE_URL não pode apontar para localhost.');
    console.error('Configure uma base de dados acessível pela Vercel (Railway/Neon/Supabase) e atualize a DATABASE_URL.');
    process.exit(1);
  }
}

console.log('[prebuild-check] OK — Variáveis obrigatórias presentes.');
