#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const isCI = Boolean(process.env.VERCEL || process.env.CI);

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  return res.status ?? (res.error ? 1 : 0);
}

const status = run('npx', ['prisma', 'migrate', 'deploy']);

if (status === 0) {
  process.exit(0);
}

if (isCI) {
  console.error('\n[BUILD ERROR] Falha ao aplicar migrações com "prisma migrate deploy". Em CI/Vercel não é permitido prosseguir.');
  process.exit(status || 1);
}

console.warn('\n[AVISO LOCAL] Não foi possível aplicar migrações agora (provavelmente a base de dados não está acessível).');
console.warn('A continuar o build sem migrações. Quando a BD estiver disponível, execute: npx prisma migrate deploy');
process.exit(0);
