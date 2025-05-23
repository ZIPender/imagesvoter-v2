import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Debug DATABASE_URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db 