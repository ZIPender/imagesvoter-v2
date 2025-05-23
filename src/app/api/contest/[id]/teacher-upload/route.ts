import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to extract user ID from token
function getUserIdFromToken(token: string): string | null {
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'teacher') {
    return parts[1];
  }
  return null;
}

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
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

    // Verify contest exists and teacher owns it
    const contest = await db.contest.findFirst({
      where: {
        id,
        teacherId: userId,
      },
    });

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found or not a teacher upload contest" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const aiImage = formData.get("aiImage") as File;
    const realImage = formData.get("realImage") as File;

    if (!aiImage || !realImage) {
      return NextResponse.json(
        { error: "Both AI image and real image are required" },
        { status: 400 }
      );
    }

    // Upload images to Cloudinary
    const aiImageUrl = await uploadToCloudinary(aiImage, `contests/${id}/ai`);
    const realImageUrl = await uploadToCloudinary(realImage, `contests/${id}/real`);

    // Create a unique participant for each teacher upload
    // Since each participant can only have one submission (unique constraint),
    // we need to create a new participant for each image pair
    const timestamp = Date.now();
    const participant = await db.participant.create({
      data: {
        nickname: `Teacher Upload #${timestamp}`,
        contestId: id,
        sessionId: `teacher_${userId}_${id}_${timestamp}`,
      },
    });

    // Create submission
    const submission = await db.submission.create({
      data: {
        aiImageUrl,
        realImageUrl,
        participantId: participant.id,
        contestId: id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      submission: {
        id: submission.id,
        aiImageUrl: submission.aiImageUrl,
        realImageUrl: submission.realImageUrl,
      }
    });
  } catch (error) {
    console.error("Error uploading teacher images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 