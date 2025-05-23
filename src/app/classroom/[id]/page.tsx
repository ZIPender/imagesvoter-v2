"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Trophy, Settings, ArrowLeft, Copy, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Classroom {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    contests: number;
  };
}

interface Contest {
  id: string;
  title: string;
  joinCode: string;
  status: "SUBMISSION" | "VOTING" | "RESULTS" | "ENDED";
  createdAt: string;
  _count: {
    participants: number;
    submissions: number;
  };
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreateContestOpen, setIsCreateContestOpen] = useState(false);
  const [newContestTitle, setNewContestTitle] = useState("");
  const [selectedContestType, setSelectedContestType] = useState("STUDENT_UPLOAD");

  useEffect(() => {
    loadClassroomData();
  }, [params.id]);

  async function loadClassroomData() {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) {
        router.push("/auth/signin");
        return;
      }

      const { token } = JSON.parse(authData);

      // Load classroom details
      const classroomResponse = await fetch(`/api/classrooms/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!classroomResponse.ok) {
        if (classroomResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error("Failed to load classroom");
      }

      const classroomData = await classroomResponse.json();
      setClassroom(classroomData.classroom);
      setContests(classroomData.contests);
      setNewName(classroomData.classroom.name);
    } catch (error) {
      console.error("Error loading classroom data:", error);
      toast({
        title: "Error",
        description: "Failed to load classroom data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRename() {
    if (!newName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a classroom name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/classrooms/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename classroom");
      }

      toast({
        title: "Success!",
        description: "Classroom renamed successfully.",
      });

      setIsRenameOpen(false);
      loadClassroomData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to rename classroom.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/classrooms/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete classroom");
      }

      toast({
        title: "Success!",
        description: "Classroom deleted successfully.",
      });

      router.push("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete classroom.",
        variant: "destructive",
      });
    }
  }

  async function createContest() {
    if (!newContestTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a contest title.",
        variant: "destructive",
      });
      return;
    }

    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch("/api/contests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: newContestTitle,
          classroomId: params.id,
          contestType: selectedContestType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contest");
      }

      toast({
        title: "Success!",
        description: "Contest created successfully.",
      });

      setNewContestTitle("");
      setSelectedContestType("STUDENT_UPLOAD");
      setIsCreateContestOpen(false);
      loadClassroomData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create contest.",
        variant: "destructive",
      });
    }
  }

  function copyJoinCode(joinCode: string) {
    navigator.clipboard.writeText(joinCode);
    toast({
      title: "Copied!",
      description: "Join code copied to clipboard.",
    });
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

  // Handle Enter key press for forms
  function handleKeyPress(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Classroom not found or access denied.</p>
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
                <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                <p className="text-sm text-gray-600">
                  Created {new Date(classroom.createdAt).toLocaleDateString()} • {classroom._count.contests} contests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Classroom</DialogTitle>
                    <DialogDescription>
                      Enter a new name for this classroom.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="classroom-name">Classroom Name</Label>
                      <Input
                        id="classroom-name"
                        placeholder="Enter classroom name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleRename)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRename}>Rename</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Classroom</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this classroom? This will also delete all contests and data associated with it. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <Dialog open={isCreateContestOpen} onOpenChange={setIsCreateContestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Contest</DialogTitle>
                <DialogDescription>
                  Create a new AI vs Real image contest in this classroom.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contest-title">Contest Title</Label>
                  <Input
                    id="contest-title"
                    placeholder="Enter contest title"
                    value={newContestTitle}
                    onChange={(e) => setNewContestTitle(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, createContest)}
                  />
                </div>
                <div>
                  <Label htmlFor="contest-type">Contest Type</Label>
                  <select
                    id="contest-type"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedContestType}
                    onChange={(e) => setSelectedContestType(e.target.value)}
                  >
                    <option value="STUDENT_UPLOAD">Student Upload - Students submit their own image pairs</option>
                    <option value="TEACHER_UPLOAD">Teacher Upload - Only teacher uploads image pairs</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateContestOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createContest}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contests.filter(c => c.status !== 'ENDED').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contests.reduce((sum, contest) => sum + contest._count.participants, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contests List */}
        <Card>
          <CardHeader>
            <CardTitle>Contests</CardTitle>
            <CardDescription>
              All contests in this classroom, ordered by creation date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contests.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No contests yet. Create your first contest to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contests.map((contest) => (
                  <Card key={contest.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{contest.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Created {new Date(contest.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{contest._count.participants} participants</span>
                            <span>{contest._count.submissions} submissions</span>
                            <Badge className={getStatusColor(contest.status)}>
                              {contest.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyJoinCode(contest.joinCode)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {contest.joinCode}
                          </Button>
                          <Link href={`/contest/${contest.id}/manage`}>
                            <Button size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 