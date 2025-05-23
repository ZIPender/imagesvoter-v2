import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Try to run a simple migration by creating tables if they don't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "password" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "classrooms" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "teacherId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "contests" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "joinCode" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'SUBMISSION',
        "contestType" TEXT NOT NULL DEFAULT 'STUDENT_UPLOAD',
        "classroomId" TEXT NOT NULL,
        "teacherId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "contests_joinCode_key" ON "contests"("joinCode");
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "participants" (
        "id" TEXT NOT NULL,
        "nickname" TEXT NOT NULL,
        "contestId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "participants_sessionId_key" ON "participants"("sessionId");
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "participants_contestId_nickname_key" ON "participants"("contestId", "nickname");
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "submissions" (
        "id" TEXT NOT NULL,
        "aiImageUrl" TEXT NOT NULL,
        "realImageUrl" TEXT NOT NULL,
        "participantId" TEXT NOT NULL,
        "contestId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "submissions_participantId_key" ON "submissions"("participantId");
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "votes" (
        "id" TEXT NOT NULL,
        "participantId" TEXT NOT NULL,
        "submissionId" TEXT NOT NULL,
        "contestId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "votes_participantId_key" ON "votes"("participantId");
    `;
    
    // Add foreign key constraints
    await prisma.$executeRaw`
      ALTER TABLE "classrooms" 
      ADD CONSTRAINT IF NOT EXISTS "classrooms_teacherId_fkey" 
      FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "contests" 
      ADD CONSTRAINT IF NOT EXISTS "contests_classroomId_fkey" 
      FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "contests" 
      ADD CONSTRAINT IF NOT EXISTS "contests_teacherId_fkey" 
      FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "participants" 
      ADD CONSTRAINT IF NOT EXISTS "participants_contestId_fkey" 
      FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "submissions" 
      ADD CONSTRAINT IF NOT EXISTS "submissions_participantId_fkey" 
      FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "submissions" 
      ADD CONSTRAINT IF NOT EXISTS "submissions_contestId_fkey" 
      FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "votes" 
      ADD CONSTRAINT IF NOT EXISTS "votes_participantId_fkey" 
      FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "votes" 
      ADD CONSTRAINT IF NOT EXISTS "votes_submissionId_fkey" 
      FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "votes" 
      ADD CONSTRAINT IF NOT EXISTS "votes_contestId_fkey" 
      FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    console.log('✅ Database schema initialized successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema initialized successfully!' 
    });
    
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