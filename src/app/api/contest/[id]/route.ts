import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = request.headers.get("X-Session-ID");
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 401 }
      );
    }

    // Find the participant by session ID
    const participant = await db.participant.findUnique({
      where: { sessionId },
      include: {
        contest: true,
        submissions: true,
        votes: true,
      },
    });

    if (!participant || participant.contestId !== id) {
      return NextResponse.json(
        { error: "Invalid session or contest" },
        { status: 403 }
      );
    }

    // Get contest with submissions and vote counts
    const contest = await db.contest.findUnique({
      where: { id },
      include: {
        classroom: {
          select: { name: true },
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
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Transform submissions to include vote counts
    const submissions = contest.submissions.map((submission) => ({
      id: submission.id,
      aiImageUrl: submission.aiImageUrl,
      realImageUrl: submission.realImageUrl,
      participantId: submission.participantId,
      participant: {
        id: submission.participantId,
        nickname: submission.participant.nickname,
      },
      votes: submission.votes.length,
    }));

    return NextResponse.json({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status,
        contestType: contest.contestType,
        joinCode: contest.joinCode,
        classroom: {
          name: contest.classroom.name,
        },
        _count: contest._count,
      },
      submissions,
      hasSubmitted: participant.submissions.length > 0,
      hasVoted: participant.votes.length > 0,
    });
  } catch (error) {
    console.error("Error fetching contest data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 