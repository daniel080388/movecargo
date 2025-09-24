#!/usr/bin/env node
// Small helper to create or update a user directly in the database.
// Usage (PowerShell):
//   $env:DATABASE_URL = "<postgres-connection-string>"; node scripts/create-user.mjs --name "Empresa Admin" --email admin@movecargo.eu --password "StrongPass123" --role EMPRESA --locale pt
// Notes:
// - role must be one of: EMPRESA | TRANSPORTADORA
// - optional: --latitude 41.15 --longitude -8.62

import bcrypt from 'bcryptjs'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      let [k, v] = a.split('=')
      k = k.replace(/^--/, '')
      if (v === undefined) {
        const next = argv[i + 1]
        if (next && !next.startsWith('--')) {
          v = next
          i++
        } else {
          v = 'true'
        }
      }
      out[k] = v
    }
  }
  return out
}

function printUsage() {
  console.log(`\nCreate or update a user in the database.\n\n` +
    `Required flags:\n` +
    `  --name "Nome Completo"\n` +
    `  --email user@example.com\n` +
    `  --password "SenhaForte123"\n` +
    `  --role EMPRESA|TRANSPORTADORA\n\n` +
    `Optional:\n` +
    `  --locale pt|en|es|fr|de    (default: pt)\n` +
    `  --latitude 41.15\n` +
    `  --longitude -8.62\n\n` +
    `Examples (PowerShell):\n` +
    `  $env:DATABASE_URL = "postgres://..."; node scripts/create-user.mjs --name "Empresa Admin" --email admin@movecargo.eu --password "StrongPass123" --role EMPRESA --locale pt\n` +
    `  $env:DATABASE_URL = "postgres://..."; node scripts/create-user.mjs --name "Transportadora" --email ops@carrier.eu --password "Another#123" --role TRANSPORTADORA --locale pt --latitude 41.15 --longitude -8.62\n`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || args.h) {
    printUsage()
    process.exit(0)
  }

  const name = args.name
  const email = args.email
  const password = args.password
  const roleStr = (args.role || '').toUpperCase()
  const locale = args.locale || 'pt'
  const lat = args.latitude !== undefined ? parseFloat(args.latitude) : undefined
  const lon = args.longitude !== undefined ? parseFloat(args.longitude) : undefined

  if (!name || !email || !password || !roleStr) {
    console.error('Erro: faltam argumentos obrigatórios.')
    printUsage()
    process.exit(1)
  }

  if (!['EMPRESA', 'TRANSPORTADORA'].includes(roleStr)) {
    console.error('Erro: role inválido. Use EMPRESA ou TRANSPORTADORA.')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('Erro: DATABASE_URL não definido no ambiente.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const data = {
    name,
    email,
    password: passwordHash,
    role: Role[roleStr],
    defaultLocale: locale,
    ...(lat !== undefined ? { latitude: lat } : {}),
    ...(lon !== undefined ? { longitude: lon } : {}),
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: data,
    create: data,
  })

  console.log(`Utilizador ${user.email} (${user.role}) criado/atualizado com id=${user.id}`)
}

main()
  .catch((err) => {
    console.error('Falha ao criar utilizador:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
