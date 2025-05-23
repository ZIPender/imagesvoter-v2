import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { submissionId, participantId, sessionId } = await request.json();

    if (!submissionId || !participantId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify participant session
    const participant = await db.participant.findUnique({
      where: { 
        id: participantId,
        sessionId: sessionId,
        contestId: id,
      },
      include: {
        contest: true,
        votes: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Invalid participant or session" },
        { status: 403 }
      );
    }

    // Check if contest is in voting phase
    if (participant.contest.status !== "VOTING") {
      return NextResponse.json(
        { error: "Contest is not in voting phase" },
        { status: 400 }
      );
    }

    // Check if participant already voted
    if (participant.votes.length > 0) {
      return NextResponse.json(
        { error: "You have already voted" },
        { status: 400 }
      );
    }

    // Verify submission exists and is not from the same participant
    const submission = await db.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.contestId !== id) {
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 400 }
      );
    }

    if (submission.participantId === participantId) {
      return NextResponse.json(
        { error: "You cannot vote for your own submission" },
        { status: 400 }
      );
    }

    // Create vote
    const vote = await db.vote.create({
      data: {
        participantId,
        submissionId,
        contestId: id,
      },
    });

    return NextResponse.json({
      success: true,
      voteId: vote.id,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 