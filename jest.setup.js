import "@testing-library/jest-dom"

// 🔹 Mock Prisma
jest.mock("@/lib/prisma", () => ({
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  plan: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  subscription: {
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  carga: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  proposta: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  supportConversation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  supportMessage: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
}))

// 🔹 Mock next/server
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      ok: !init?.status || init.status < 400,
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}))

// 🔹 Mock next-intl (sem client!)
jest.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
  useFormatter: () => (value) => value,
  useLocale: () => "pt", // 👈 coloquei aqui o useLocale
}))

// 🔹 Mock App Router (next/navigation)
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/mock-path",
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

// 🔹 Mock node-fetch (ESM) para evitar erros de import nos testes
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(async () => ({ ok: true, json: async () => ({}) })),
}))
