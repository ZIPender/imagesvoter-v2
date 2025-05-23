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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get contest with all related data
    const contest = await db.contest.findFirst({
      where: {
        id,
        teacherId: userId, // Ensure teacher owns this contest
      },
      include: {
        classroom: {
          select: { name: true },
        },
        participants: {
          include: {
            submissions: true,
            votes: true,
          },
        },
        submissions: {
          include: {
            participant: {
              select: { nickname: true },
            },
            votes: true,
          },
        },
        _count: {
          select: {
            participants: true,
            submissions: true,
          },
        },
      },
    });

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found or access denied" },
        { status: 404 }
      );
    }

    // Debug: Log the contest object to see what fields are available
    console.log("Contest object keys:", Object.keys(contest));
    console.log("Contest contestType:", (contest as unknown as { contestType: string }).contestType);

    // Transform participants data - exclude teacher uploads
    const participants = contest.participants
      .filter((participant) => !participant.nickname.startsWith("Teacher Upload"))
      .map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        createdAt: participant.createdAt,
        hasSubmitted: participant.submissions.length > 0,
        hasVoted: participant.votes.length > 0,
      }));

    // Transform submissions data with vote counts
    const submissions = contest.submissions.map((submission) => ({
      id: submission.id,
      aiImageUrl: submission.aiImageUrl,
      realImageUrl: submission.realImageUrl,
      participant: {
        nickname: submission.participant.nickname,
      },
      votes: submission.votes.length,
    }));

    return NextResponse.json({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status,
        contestType: (contest as unknown as { contestType: string }).contestType,
        joinCode: contest.joinCode,
        classroom: {
          name: contest.classroom.name,
        },
        _count: contest._count,
      },
      participants,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching contest management data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { status } = await request.json();

    if (!["SUBMISSION", "VOTING", "RESULTS", "ENDED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update contest status
    const contest = await db.contest.updateMany({
      where: {
        id,
        teacherId: userId, // Ensure teacher owns this contest
      },
      data: {
        status,
      },
    });

    if (contest.count === 0) {
      return NextResponse.json(
        { error: "Contest not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contest status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 