import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSessionId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { joinCode, nickname } = await request.json();

    if (!joinCode || !nickname) {
      return NextResponse.json(
        { error: "Join code and nickname are required" },
        { status: 400 }
      );
    }

    // Find the contest by join code
    const contest = await db.contest.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: {
        participants: true,
      },
    });

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found. Please check your code." },
        { status: 404 }
      );
    }

    // Check if contest is in submission phase
    if (contest.status !== "SUBMISSION") {
      return NextResponse.json(
        { error: "Contest is not accepting new participants" },
        { status: 400 }
      );
    }

    // Check if nickname is already taken in this contest
    const existingParticipant = contest.participants.find(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: "This nickname is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // Create new participant
    const sessionId = generateSessionId();
    const participant = await db.participant.create({
      data: {
        nickname,
        contestId: contest.id,
        sessionId,
      },
    });

    return NextResponse.json({
      contestId: contest.id,
      participantId: participant.id,
      sessionId: participant.sessionId,
      contestTitle: contest.title,
      status: contest.status,
    });
  } catch (error) {
    console.error("Error joining contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 