import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `ai-vs-real/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    ).end(buffer);
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const aiImage = formData.get("aiImage") as File;
    const realImage = formData.get("realImage") as File;
    const participantId = formData.get("participantId") as string;
    const sessionId = formData.get("sessionId") as string;

    if (!aiImage || !realImage || !participantId || !sessionId) {
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
        submissions: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Invalid participant or session" },
        { status: 403 }
      );
    }

    // Check if contest is in submission phase
    if (participant.contest.status !== "SUBMISSION") {
      return NextResponse.json(
        { error: "Contest is not accepting submissions" },
        { status: 400 }
      );
    }

    // Check if participant already submitted
    if (participant.submissions.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted images" },
        { status: 400 }
      );
    }

    // Upload images to Cloudinary
    const [aiImageUrl, realImageUrl] = await Promise.all([
      uploadToCloudinary(aiImage, `contest-${id}/ai`),
      uploadToCloudinary(realImage, `contest-${id}/real`)
    ]);

    // Create submission
    const submission = await db.submission.create({
      data: {
        aiImageUrl,
        realImageUrl,
        participantId,
        contestId: id,
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Error submitting images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 