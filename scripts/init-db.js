import { PrismaClient } from '@prisma/client';

async function initDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Initializing database...');
    
    // Try to create a simple query to test connection and trigger schema creation
    await prisma.$executeRaw`SELECT 1`;
    
    console.log('✅ Database connection successful!');
    
    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema exists. Found ${userCount} users.`);
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('❌ Database schema not found. Please run: npx prisma db push');
      } else {
        console.error('❌ Error checking schema:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase(); 