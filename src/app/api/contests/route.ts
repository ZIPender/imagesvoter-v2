import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function to extract user ID from token
function getUserIdFromToken(token: string): string | null {
  // Simple token format: teacher_${userId}_${timestamp}
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'teacher') {
    return parts[1];
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const contests = await db.contest.findMany({
      where: {
        teacherId: userId,
      },
      include: {
        classroom: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            participants: true,
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contests);
  } catch (error) {
    console.error("Error fetching contests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { title, classroomId, contestType = "STUDENT_UPLOAD" } = await request.json();

    if (!title || !classroomId) {
      return NextResponse.json(
        { error: "Title and classroom ID are required" },
        { status: 400 }
      );
    }

    // Verify the classroom belongs to the teacher
    const classroom = await db.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId: userId,
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found or access denied" },
        { status: 404 }
      );
    }

    // Generate a unique 6-character join code
    let joinCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await db.contest.findUnique({
        where: { joinCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Create the contest
    const contest = await db.contest.create({
      data: {
        title,
        joinCode: joinCode!,
        classroomId,
        teacherId: userId,
        contestType,
      },
      include: {
        classroom: {
          select: { name: true },
        },
        _count: {
          select: {
            participants: true,
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.error("Error creating contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 