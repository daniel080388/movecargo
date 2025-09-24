#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'support-conversations.json')
  if (!fs.existsSync(dataPath)) {
    console.log('No support-conversations.json found at', dataPath)
    return
  }
  const raw = fs.readFileSync(dataPath, 'utf-8')
  const store = JSON.parse(raw)
  const entries = Object.entries(store) // [sessionId, messages[]]
  console.log(`Found ${entries.length} sessions to migrate`)
  let migrated = 0
  for (const [sessionId, messages] of entries) {
    try {
      const conv = await prisma.supportConversation.create({
        data: {
          sessionId,
          messages: {
            create: messages.map((m) => ({ role: m.from || 'user', text: m.text || m })) ,
          },
        },
      })
      migrated++
    } catch (e) {
      console.error('Failed to migrate session', sessionId, e)
    }
  }
  console.log(`Migrated ${migrated} conversations`)
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
