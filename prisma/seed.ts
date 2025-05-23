import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a test teacher account
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      name: 'Test Teacher',
      password: hashedPassword,
    },
  })

  console.log('Created teacher:', teacher)

  // Create a test classroom
  const classroom = await prisma.classroom.upsert({
    where: { id: 'test-classroom' },
    update: {},
    create: {
      id: 'test-classroom',
      name: 'Test Classroom',
      teacherId: teacher.id,
    },
  })

  console.log('Created classroom:', classroom)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 