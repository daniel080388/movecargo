import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

type SupportBody = {
  userId?: string
  email?: string
  message: string
}

const TICKETS_FILE = path.resolve(process.cwd(), 'data', 'support-tickets.json')

function ensureTicketsFile() {
  const dir = path.dirname(TICKETS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(TICKETS_FILE)) fs.writeFileSync(TICKETS_FILE, JSON.stringify([]))
}

function saveTicket(ticket: any) {
  ensureTicketsFile()
  const content = fs.readFileSync(TICKETS_FILE, 'utf8')
  const arr = JSON.parse(content || '[]')
  arr.push(ticket)
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(arr, null, 2))
}

function aiReply(message: string) {
  const lc = message.toLowerCase()
  if (lc.includes('preço') || lc.includes('preco') || lc.includes('pag')) {
    return 'Parece relacionado com pagamento — aconselhamos verificar a página de Billing na sua conta. Se desejar, podemos iniciar um pedido para suporte.'
  }
  if (lc.includes('proposta') || lc.includes('aceit')) {
    return 'Sobre propostas: pode ver/gerir propostas na página da carga. Após aceitar, os contactos são libertados ao transportador.'
  }
  if (lc.includes('login') || lc.includes('senha') || lc.includes('password')) {
    return 'Problemas de login: tente resetar a password através do link de recuperação. Se não receber email verifique a caixa de spam.'
  }
  return 'Obrigado pela mensagem. Criámos um ticket para revisão humana e um agente responderá em breve.'
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SupportBody
    const ticket = {
      id: `t_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: body.userId || null,
      email: body.email || null,
      message: body.message,
      reply: aiReply(body.message),
      status: 'open'
    }
    saveTicket(ticket)
    return NextResponse.json({ ticket })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
