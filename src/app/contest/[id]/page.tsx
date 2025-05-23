"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trophy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageModal } from "@/components/ui/image-modal";

interface ContestSession {
  participantId: string;
  hasSubmitted: boolean;
  hasVoted: boolean;
  sessionId: string;
  nickname: string;
}

interface Contest {
  id: string;
  title: string;
  status: "SUBMISSION" | "VOTING" | "RESULTS" | "ENDED";
  contestType: "STUDENT_UPLOAD" | "TEACHER_UPLOAD";
  joinCode: string;
  classroom: {
    name: string;
  };
  _count: {
    participants: number;
    submissions: number;
  };
}

interface Submission {
  id: string;
  aiImageUrl: string;
  realImageUrl: string;
  votes: number;
  participant: {
    id: string;
    nickname: string;
  };
}

export default function ContestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contest, setContest] = useState<Contest | null>(null);
  const [session, setSession] = useState<ContestSession | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [realImage, setRealImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiImagePreview, setAiImagePreview] = useState<string>("");
  const [realImagePreview, setRealImagePreview] = useState<string>("");
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    aiImageUrl: string;
    realImageUrl: string;
    participantName: string;
    initialImage: "ai" | "real";
  }>({
    isOpen: false,
    aiImageUrl: "",
    realImageUrl: "",
    participantName: "",
    initialImage: "ai",
  });

  const loadContestData = useCallback(async (sessionData: ContestSession) => {
    try {
      const response = await fetch(`/api/contest/${params.id}`, {
        headers: {
          "X-Session-ID": sessionData.sessionId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load contest data");
      }

      const data = await response.json();
      setContest(data.contest);
      setSubmissions(data.submissions);
      
      // Update session with server data
      const updatedSession = {
        ...sessionData,
        hasSubmitted: data.hasSubmitted,
        hasVoted: data.hasVoted,
      };
      setSession(updatedSession);
      localStorage.setItem(`contest_${params.id}`, JSON.stringify(updatedSession));
    } catch (error) {
      console.error("Error loading contest data:", error);
      toast({
        title: "Error",
        description: "Failed to load contest data",
        variant: "destructive",
      });
    }
  }, [params.id, toast]);

  useEffect(() => {
    const sessionData = localStorage.getItem(`contest_${params.id}`);
    if (!sessionData) {
      router.push(`/join?contest=${params.id}`);
      return;
    }

    const session: ContestSession = JSON.parse(sessionData);
    setSession(session);
    loadContestData(session);
    setIsLoading(false);

    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      loadContestData(session);
    }, 3000);

    return () => clearInterval(interval);
  }, [params.id, router, loadContestData]);

  function handleAiImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAiImage(file);
      const reader = new FileReader();
      reader.onload = () => setAiImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleRealImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setRealImage(file);
      const reader = new FileReader();
      reader.onload = () => setRealImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmission() {
    if (!aiImage || !realImage || !session) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("aiImage", aiImage);
      formData.append("realImage", realImage);
      formData.append("participantId", session.participantId);
      formData.append("sessionId", session.sessionId);

      const response = await fetch(`/api/contest/${params.id}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit images");
      }

      toast({
        title: "Success!",
        description: "Your images have been submitted successfully.",
      });

      // Update session
      const updatedSession = { ...session, hasSubmitted: true };
      localStorage.setItem(`contest_${params.id}`, JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      // Reload contest data
      loadContestData(updatedSession);
    } catch (error) {
      console.error("Error submitting images:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVote(submissionId: string) {
    if (!session) return;

    try {
      const response = await fetch(`/api/contest/${params.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          submissionId,
          participantId: session.participantId,
          sessionId: session.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      toast({
        title: "Vote Submitted!",
        description: "Thank you for voting.",
      });

      // Update session
      const updatedSession = { ...session, hasVoted: true };
      localStorage.setItem(`contest_${params.id}`, JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      // Reload contest data
      loadContestData(updatedSession);
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Vote Failed",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    }
  }

  function openImageModal(
    aiImageUrl: string,
    realImageUrl: string,
    participantName: string,
    initialImage: "ai" | "real" = "ai"
  ) {
    setImageModal({
      isOpen: true,
      aiImageUrl,
      realImageUrl,
      participantName,
      initialImage,
    });
  }

  function closeImageModal() {
    setImageModal(prev => ({ ...prev, isOpen: false }));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Contest not found or session expired.</p>
            <Button onClick={() => router.push("/join")} className="mt-4">
              Join a Contest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contest.title}</h1>
              <p className="text-gray-600">Welcome, {session.nickname}!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Contest Code</p>
              <p className="text-lg font-mono font-bold">{contest.joinCode}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contest Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {contest.title}
              </span>
              <Badge className={getStatusColor(contest.status)}>
                {contest.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {contest.classroom.name} • {contest._count.participants} participants
              {contest.contestType === "TEACHER_UPLOAD" && (
                <span className="block text-blue-600 font-medium mt-1">
                  Teacher Upload Contest - Vote on teacher-provided image pairs
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{contest._count.participants}</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{contest._count.submissions}</div>
                <div className="text-sm text-gray-600">
                  {contest.contestType === "TEACHER_UPLOAD" ? "Image Pairs" : "Submissions"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{contest.joinCode}</div>
                <div className="text-sm text-gray-600">Join Code</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Phase - Only for Student Upload contests */}
        {contest.status === "SUBMISSION" && contest.contestType === "STUDENT_UPLOAD" && !session?.hasSubmitted && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Submit Your Images
              </CardTitle>
              <CardDescription>
                Upload one AI-generated image and one real photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* AI Image Upload */}
                <div>
                  <Label htmlFor="ai-image">AI Generated Image</Label>
                  <div className="mt-2">
                    {aiImagePreview ? (
                      <div className="relative">
                        <img
                          src={aiImagePreview}
                          alt="AI image preview"
                          className="w-full h-48 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setAiImage(null);
                            setAiImagePreview("");
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload AI image</p>
                        <Input
                          id="ai-image"
                          type="file"
                          accept="image/*"
                          onChange={handleAiImageChange}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("ai-image")?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real Image Upload */}
                <div>
                  <Label htmlFor="real-image">Real Photo</Label>
                  <div className="mt-2">
                    {realImagePreview ? (
                      <div className="relative">
                        <img
                          src={realImagePreview}
                          alt="Real image preview"
                          className="w-full h-48 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setRealImage(null);
                            setRealImagePreview("");
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload real photo</p>
                        <Input
                          id="real-image"
                          type="file"
                          accept="image/*"
                          onChange={handleRealImageChange}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("real-image")?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmission} 
                  disabled={isSubmitting || !aiImage || !realImage}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Images"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting for submissions - Teacher Upload contests */}
        {contest.status === "SUBMISSION" && contest.contestType === "TEACHER_UPLOAD" && (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Waiting for Teacher</h3>
              <p className="text-gray-600">
                Your teacher is preparing the image pairs for voting. Please wait...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Already submitted - Student Upload contests */}
        {contest.status === "SUBMISSION" && contest.contestType === "STUDENT_UPLOAD" && session?.hasSubmitted && (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Images Submitted!</h3>
              <p className="text-gray-600">
                Your images have been submitted successfully. Wait for the voting phase to begin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Voting Phase */}
        {contest.status === "VOTING" && !session?.hasVoted && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vote for the Best Images
              </CardTitle>
              <CardDescription>
                Click on the image pair you think looks the most realistic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {submissions.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                    onClick={() => handleVote(submission.id)}
                  >
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">AI Generated</p>
                          <img
                            src={submission.aiImageUrl}
                            alt="AI generated"
                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(
                                submission.aiImageUrl,
                                submission.realImageUrl,
                                submission.participant.nickname,
                                "ai"
                              );
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Real Photo</p>
                          <img
                            src={submission.realImageUrl}
                            alt="Real photo"
                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(
                                submission.aiImageUrl,
                                submission.realImageUrl,
                                submission.participant.nickname,
                                "real"
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          {contest.contestType === "TEACHER_UPLOAD" ? "Teacher Upload" : `By ${submission.participant.nickname}`}
                        </p>
                        <Button className="mt-2" disabled={session.hasVoted}>
                          {session.hasVoted ? "Voted" : "Vote for this pair"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already voted */}
        {contest.status === "VOTING" && session?.hasVoted && (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vote Submitted!</h3>
              <p className="text-gray-600">
                Thank you for voting! Wait for the results to be announced.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Phase */}
        {(contest.status === "RESULTS" || contest.status === "ENDED") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Contest Results
              </CardTitle>
              <CardDescription>
                Final results ranked by votes received
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {submissions
                  .sort((a, b) => b.votes - a.votes)
                  .map((submission, index) => (
                  <Card key={submission.id} className={index === 0 ? "border-yellow-300 bg-yellow-50" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-600" />}
                          <span className="font-semibold">
                            {index === 0 ? "🥇 Winner" : `#${index + 1}`}
                          </span>
                          <span className="text-gray-600">
                            {contest.contestType === "TEACHER_UPLOAD" ? "Teacher Upload" : submission.participant.nickname}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {submission.votes} votes
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">AI Generated</p>
                          <img
                            src={submission.aiImageUrl}
                            alt="AI generated"
                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(
                              submission.aiImageUrl,
                              submission.realImageUrl,
                              contest.contestType === "TEACHER_UPLOAD" ? "Teacher Upload" : submission.participant.nickname,
                              "ai"
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Real Photo</p>
                          <img
                            src={submission.realImageUrl}
                            alt="Real photo"
                            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(
                              submission.aiImageUrl,
                              submission.realImageUrl,
                              contest.contestType === "TEACHER_UPLOAD" ? "Teacher Upload" : submission.participant.nickname,
                              "real"
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        aiImageUrl={imageModal.aiImageUrl}
        realImageUrl={imageModal.realImageUrl}
        participantName={imageModal.participantName}
        initialImage={imageModal.initialImage}
      />
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "SUBMISSION":
      return "bg-yellow-100 text-yellow-800";
    case "VOTING":
      return "bg-blue-100 text-blue-800";
    case "RESULTS":
      return "bg-green-100 text-green-800";
    case "ENDED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
} 