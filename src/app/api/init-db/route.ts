import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try to check if tables exist by running a simple query
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema already exists. Found ${userCount} users.`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Database schema already exists. Found ${userCount} users.`,
        alreadyExists: true
      });
      
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2021') {
        // Tables don't exist - this is expected for a new database
        console.log('📋 Database schema not found. This endpoint cannot create tables automatically.');
        console.log('💡 Please run database migrations using one of these methods:');
        console.log('   1. Use Vercel CLI: npx vercel env pull && npx prisma db push');
        console.log('   2. Use Prisma Studio: https://www.prisma.io/studio');
        console.log('   3. Contact your database administrator');
        
        return NextResponse.json({ 
          success: false, 
          error: 'Database schema not found',
          message: 'Tables do not exist. Please run database migrations.',
          instructions: [
            'Method 1: Use Vercel CLI locally',
            '  - npx vercel env pull',
            '  - npx prisma db push',
            '',
            'Method 2: Use database admin tools',
            '  - Access your Vercel Postgres dashboard',
            '  - Run the schema creation manually',
            '',
            'Method 3: Contact support',
            '  - The database user may need additional permissions'
          ]
        }, { status: 400 });
        
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    await prisma.$connect();
    
    // Check database status
    try {
      const userCount = await prisma.user.count();
      const classroomCount = await prisma.classroom.count();
      const contestCount = await prisma.contest.count();
      
      return NextResponse.json({
        success: true,
        status: 'Database is ready',
        stats: {
          users: userCount,
          classrooms: classroomCount,
          contests: contestCount
        }
      });
      
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2021') {
        return NextResponse.json({
          success: false,
          status: 'Database schema not found',
          message: 'Tables do not exist. Please run database migrations.'
        });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 