import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function to extract user ID from token
function getUserIdFromToken(token: string): string | null {
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'teacher') {
    return parts[1];
  }
  return null;
}

export async function DELETE(
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

    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Verify contest ownership
    const contest = await db.contest.findFirst({
      where: {
        id,
        teacherId: userId,
      },
    });

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found or access denied" },
        { status: 404 }
      );
    }

    // Verify participant exists in this contest
    const participant = await db.participant.findFirst({
      where: {
        id: participantId,
        contestId: id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found in this contest" },
        { status: 404 }
      );
    }

    // Delete participant (this will cascade delete submissions and votes)
    await db.participant.delete({
      where: { id: participantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error kicking participant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 