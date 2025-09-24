#!/usr/bin/env node
/**
 * Fail-fast check for required environment variables during build.
 * Specifically ensures DATABASE_URL is present before running Prisma migrations.
 */

const required = [
  'DATABASE_URL',
];

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length) {
  console.error('\n[BUILD CONFIG ERROR] Variáveis de ambiente em falta:', missing.join(', '));
  console.error('Defina-as nas Environment Variables do projeto Vercel (Production/Preview) e volte a fazer deploy.');
  console.error('Nota: o script de build executa "prisma migrate deploy" que exige DATABASE_URL.');
  process.exit(1);
}

console.log('[prebuild-check] OK — Variáveis obrigatórias presentes.');
