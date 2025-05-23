"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Settings, ArrowLeft, Copy, Play, RotateCcw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageModal } from "@/components/ui/image-modal";
import { ImagePairManager } from "@/components/ui/image-pair-manager";

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

interface Participant {
  id: string;
  nickname: string;
  createdAt: string;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

interface Submission {
  id: string;
  aiImageUrl: string;
  realImageUrl: string;
  participant: {
    nickname: string;
  };
  votes: number;
}

export default function ContestManagePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contest, setContest] = useState<Contest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const loadContestData = useCallback(async () => {
    try {
      // Check authentication
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) {
        router.push("/auth/signin");
        return;
      }

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/contest/${params.id}/manage`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error("Failed to load contest data");
      }

      const data = await response.json();
      setContest(data.contest);
      setParticipants(data.participants);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error("Error loading contest data:", error);
      if (!contest) {
        toast({
          title: "Error",
          description: "Failed to load contest data",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router, contest, toast]);

  useEffect(() => {
    loadContestData();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadContestData, 5000);
    return () => clearInterval(interval);
  }, [loadContestData]);

  async function updateContestStatus(newStatus: string) {
    if (!contest) return;

    setIsUpdating(true);
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/contest/${params.id}/manage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update contest status");
      }

      toast({
        title: "Success!",
        description: `Contest moved to ${newStatus.toLowerCase()} phase.`,
      });

      loadContestData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contest status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  function copyJoinCode() {
    if (contest) {
      navigator.clipboard.writeText(contest.joinCode);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard.",
      });
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "SUBMISSION": return "bg-blue-100 text-blue-800";
      case "VOTING": return "bg-yellow-100 text-yellow-800";
      case "RESULTS": return "bg-green-100 text-green-800";
      case "ENDED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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

  async function kickParticipant(participantId: string, nickname: string) {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/contest/${params.id}/kick`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId }),
      });

      if (!response.ok) {
        throw new Error("Failed to kick participant");
      }

      toast({
        title: "Success!",
        description: `${nickname} has been removed from the contest.`,
      });

      loadContestData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to kick participant.",
        variant: "destructive",
      });
    }
  }

  async function deleteSubmission(submissionId: string, participantName: string) {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/contest/${params.id}/submissions/${submissionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete submission");
      }

      toast({
        title: "Success!",
        description: `Submission by ${participantName} has been deleted.`,
      });

      loadContestData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete submission.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Contest not found or access denied.</p>
            <Link href="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contest.title}</h1>
                <p className="text-sm text-gray-600">
                  {contest.classroom.name} • Managing Contest
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(contest.status)}>
                {contest.status}
              </Badge>
              <Button variant="outline" onClick={copyJoinCode}>
                <Copy className="h-4 w-4 mr-2" />
                {contest.joinCode}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contest Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Contest Controls
            </CardTitle>
            <CardDescription>
              Manage the contest phases and monitor progress
              {contest?.contestType === "TEACHER_UPLOAD" && (
                <span className="block text-blue-600 font-medium mt-1">
                  Teacher Upload Mode - Only you can upload image pairs
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {contest?.status === "SUBMISSION" && (
                <Button
                  onClick={() => updateContestStatus("VOTING")}
                  disabled={isUpdating || submissions.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Voting Phase
                </Button>
              )}

              {contest?.status === "VOTING" && (
                <Button
                  onClick={() => updateContestStatus("RESULTS")}
                  disabled={isUpdating}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Show Results
                </Button>
              )}

              {contest?.status === "RESULTS" && (
                <Button
                  variant="outline"
                  onClick={() => updateContestStatus("SUBMISSION")}
                  disabled={isUpdating}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Submission
                </Button>
              )}

              {contest?.status === "ENDED" && (
                <Button
                  variant="outline"
                  onClick={() => updateContestStatus("RESULTS")}
                  disabled={isUpdating}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Show Results Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Pair Manager for Teacher Upload Contests */}
        {contest?.contestType === "TEACHER_UPLOAD" && (
          <div className="mb-8">
            <ImagePairManager 
              contestId={params.id as string}
              imagePairs={submissions}
              onImagePairsUpdate={loadContestData}
            />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
              <p className="text-xs text-muted-foreground">
                {participants.filter(p => p.hasSubmitted).length} submitted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Image pairs submitted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {participants.filter(p => p.hasVoted).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {participants.length} participants
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Participants List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              Real-time view of participant activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No participants yet. Share the join code: <strong>{contest.joinCode}</strong>
              </p>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{participant.nickname}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(participant.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={participant.hasSubmitted ? "default" : "secondary"}>
                        {participant.hasSubmitted ? "Submitted" : "Pending"}
                      </Badge>
                      {contest.status === "VOTING" && (
                        <Badge variant={participant.hasVoted ? "default" : "secondary"}>
                          {participant.hasVoted ? "Voted" : "Not Voted"}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => kickParticipant(participant.id, participant.nickname)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submissions (if any) */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>
                {contest?.status === "RESULTS" || contest?.status === "ENDED" 
                  ? "Final results with vote counts" 
                  : "Current submissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions
                  .sort((a, b) => b.votes - a.votes)
                  .map((submission, index) => (
                  <Card key={submission.id} className={index === 0 && submissions[0].votes > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{submission.participant.nickname}</span>
                        {index === 0 && submissions[0].votes > 0 && (
                          <Trophy className="h-4 w-4 text-yellow-600" />
                        )}
                      </CardTitle>
                      {(contest?.status === "RESULTS" || contest?.status === "ENDED") && (
                        <CardDescription>
                          {submission.votes} votes
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">AI Image</p>
                          <img
                            src={submission.aiImageUrl}
                            alt="AI generated"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(
                              submission.aiImageUrl,
                              submission.realImageUrl,
                              submission.participant.nickname,
                              "ai"
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Real Photo</p>
                          <img
                            src={submission.realImageUrl}
                            alt="Real photo"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(
                              submission.aiImageUrl,
                              submission.realImageUrl,
                              submission.participant.nickname,
                              "real"
                            )}
                          />
                        </div>
                        {/* Delete button for teacher uploads */}
                        {submission.participant.nickname.startsWith("Teacher Upload") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => deleteSubmission(submission.id, submission.participant.nickname)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Delete Image Pair
                          </Button>
                        )}
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