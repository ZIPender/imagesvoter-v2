"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GraduationCap, Plus, Users, Trophy, Settings, LogOut, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

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
  status: string;
  createdAt: string;
  classroom: {
    name: string;
  };
  _count: {
    participants: number;
    submissions: number;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateClassroomOpen, setIsCreateClassroomOpen] = useState(false);
  const [isCreateContestOpen, setIsCreateContestOpen] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [newContestTitle, setNewContestTitle] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedContestType, setSelectedContestType] = useState("STUDENT_UPLOAD");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const authData = localStorage.getItem("teacherAuth");
    if (!authData) {
      router.push("/auth/signin");
      return;
    }

    const parsedAuth = JSON.parse(authData);
    setUser(parsedAuth.user);
    
    // Load dashboard data
    loadDashboardData();
  }, [router]);

  async function loadDashboardData() {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      // Load classrooms
      const classroomsResponse = await fetch("/api/classrooms", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (classroomsResponse.ok) {
        const classroomsData = await classroomsResponse.json();
        setClassrooms(classroomsData);
      }

      // Load contests
      const contestsResponse = await fetch("/api/contests", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (contestsResponse.ok) {
        const contestsData = await contestsResponse.json();
        setContests(contestsData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createClassroom() {
    if (!newClassroomName.trim()) {
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

      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassroomName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create classroom");
      }

      toast({
        title: "Success!",
        description: "Classroom created successfully.",
      });

      setNewClassroomName("");
      setIsCreateClassroomOpen(false);
      loadDashboardData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create classroom.",
        variant: "destructive",
      });
    }
  }

  async function createContest() {
    if (!newContestTitle.trim() || !selectedClassroomId) {
      toast({
        title: "Missing Information",
        description: "Please enter a contest title and select a classroom.",
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
          classroomId: selectedClassroomId,
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
      setSelectedClassroomId("");
      setSelectedContestType("STUDENT_UPLOAD");
      setIsCreateContestOpen(false);
      loadDashboardData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create contest.",
        variant: "destructive",
      });
    }
  }

  // Handle Enter key press for forms
  function handleClassroomKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      createClassroom();
    }
  }

  function handleContestKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      createContest();
    }
  }

  function handleSignOut() {
    localStorage.removeItem("teacherAuth");
    router.push("/");
  }

  function copyJoinCode(joinCode: string) {
    navigator.clipboard.writeText(joinCode);
    toast({
      title: "Copied!",
      description: "Join code copied to clipboard.",
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Dialog open={isCreateClassroomOpen} onOpenChange={setIsCreateClassroomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Classroom</DialogTitle>
                  <DialogDescription>
                    Create a new classroom to organize your contests.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="classroom-name">Classroom Name</Label>
                    <Input
                      id="classroom-name"
                      placeholder="Enter classroom name"
                      value={newClassroomName}
                      onChange={(e) => setNewClassroomName(e.target.value)}
                      onKeyDown={handleClassroomKeyPress}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateClassroomOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createClassroom}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateContestOpen} onOpenChange={setIsCreateContestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Trophy className="h-4 w-4 mr-2" />
                  Create Contest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Contest</DialogTitle>
                  <DialogDescription>
                    Create a new AI vs Real image contest for your students.
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
                      onKeyDown={handleContestKeyPress}
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
                  <div>
                    <Label htmlFor="classroom-select">Select Classroom</Label>
                    <select
                      id="classroom-select"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={selectedClassroomId}
                      onChange={(e) => setSelectedClassroomId(e.target.value)}
                    >
                      <option value="">Select a classroom</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
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
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classrooms.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
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

        {/* Recent Contests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Contests</h2>
          <div className="grid gap-4">
            {contests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No contests yet. Create your first contest to get started!</p>
                </CardContent>
              </Card>
            ) : (
              contests.slice(0, 5).map((contest) => (
                <Card key={contest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{contest.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Classroom: {contest.classroom.name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{contest._count.participants} participants</span>
                          <span>{contest._count.submissions} submissions</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contest.status === 'SUBMISSION' ? 'bg-blue-100 text-blue-800' :
                            contest.status === 'VOTING' ? 'bg-yellow-100 text-yellow-800' :
                            contest.status === 'RESULTS' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contest.status}
                          </span>
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
              ))
            )}
          </div>
        </div>

        {/* Classrooms */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Classrooms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No classrooms yet. Create your first classroom to get started!</p>
                </CardContent>
              </Card>
            ) : (
              classrooms.map((classroom) => (
                <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    <CardDescription>
                      {classroom._count.contests} contest{classroom._count.contests !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Created {new Date(classroom.createdAt).toLocaleDateString()}
                    </p>
                    <Link href={`/classroom/${classroom.id}`}>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 