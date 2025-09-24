// Mock global do Prisma para Jest
const mockUser = {
  update: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
}

const mockCarga = {
  create: jest.fn(),
  findMany: jest.fn(),
}

const mockProposta = {
  create: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
}

const prisma = {
  user: mockUser,
  carga: mockCarga,
  proposta: mockProposta,
}

export const PrismaClient = jest.fn(() => prisma)
export default prisma
