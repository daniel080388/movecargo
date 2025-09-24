import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import ClientConfig from './ClientConfig'

export const generateStaticParams = () => {
  const locales = ['pt', 'en', 'es', 'de']
  return locales.map((locale) => ({ locale }))
}

export default async function Configuracoes({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const cookieStore = await cookies()
  // cookies() can be async in some Next versions; await to get ReadonlyRequestCookies
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect(`/${locale}/login`)
  }

  let user = null
  try {
    const decoded = verifyToken(token)
    if (!decoded || !(decoded as any).userId) throw new Error('invalid token')
    user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
    })
  } catch (err) {
    console.error(err)
  redirect(`/${locale}/login`)
  }

  if (!user) {
  redirect(`/${locale}/login`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold">Configurações Globais</h1>
      <ClientConfig
        initialLocale={user.defaultLocale || 'pt'}
        initialPreferences={user.notificationPreferences || {}}
        initialTheme={user.theme || 'sistema'}
        initialRadius={user.searchRadius || 100}
        initialLatitude={user.latitude || ''}
        initialLongitude={user.longitude || ''}
        role={user.role}
      />
    </div>
  )
}
