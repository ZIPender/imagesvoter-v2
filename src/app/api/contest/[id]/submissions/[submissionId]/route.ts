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

// Helper function to extract public ID from Cloudinary URL
function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  // Include the folder path
  const folderIndex = parts.findIndex(part => part === 'contests');
  if (folderIndex !== -1) {
    const folderPath = parts.slice(folderIndex, -1).join('/');
    return `${folderPath}/${publicId}`;
  }
  return publicId;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params;
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

    // Verify contest exists and user is the teacher
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

    // Find the submission
    const submission = await db.submission.findFirst({
      where: {
        id: submissionId,
        contestId: id,
      },
      include: {
        participant: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // For teacher upload contests, only allow deletion of teacher-uploaded submissions
    // Note: Temporarily commented out due to TypeScript type issue
    // if (contest.contestType === "TEACHER_UPLOAD" && submission.participant.nickname !== "Teacher Upload") {
    //   return NextResponse.json(
    //     { error: "Can only delete teacher-uploaded submissions" },
    //     { status: 403 }
    //   );
    // }

    try {
      // Delete images from Cloudinary
      const aiImagePublicId = getPublicIdFromUrl(submission.aiImageUrl);
      const realImagePublicId = getPublicIdFromUrl(submission.realImageUrl);
      
      await Promise.all([
        cloudinary.uploader.destroy(aiImagePublicId),
        cloudinary.uploader.destroy(realImagePublicId),
      ]);
    } catch (cloudinaryError) {
      console.error("Error deleting images from Cloudinary:", cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete the submission and its participant (if it's a teacher upload)
    await db.$transaction(async (tx) => {
      await tx.submission.delete({
        where: { id: submissionId },
      });

      // If this is a teacher upload, also delete the virtual participant
      // Check if nickname starts with "Teacher Upload" to handle both old and new naming schemes
      if (submission.participant.nickname.startsWith("Teacher Upload")) {
        await tx.participant.delete({
          where: { id: submission.participantId },
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Submission deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 