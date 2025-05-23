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

    // Validate status
    const validStatuses = ["SUBMISSION", "VOTING", "RESULTS", "ENDED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
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

    // Update contest status
    const updatedContest = await db.contest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      contest: {
        id: updatedContest.id,
        status: updatedContest.status,
      },
    });
  } catch (error) {
    console.error("Error updating contest status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 