"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleJoin() {
    if (!joinCode.trim() || !nickname.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a join code and nickname.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/contest/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          joinCode: joinCode.toUpperCase(),
          nickname: nickname.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join contest");
      }

      // Store session info in localStorage
      localStorage.setItem(`contest_${data.contestId}`, JSON.stringify({
        participantId: data.participantId,
        hasSubmitted: false,
        hasVoted: false,
        sessionId: data.sessionId,
        nickname: nickname.trim(),
      }));

      // Redirect to contest page
      router.push(`/contest/${data.contestId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join contest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Enter key press
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoin();
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI vs Real Contest</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Camera className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Join Contest</CardTitle>
              <CardDescription>
                Enter the 6-digit code provided by your teacher and choose a nickname
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Contest Code</Label>
                <Input
                  id="joinCode"
                  placeholder="Enter 6-digit code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                  onKeyDown={handleKeyPress}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Your Nickname</Label>
                <Input
                  id="nickname"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  onKeyDown={handleKeyPress}
                />
                <p className="text-xs text-gray-500">
                  This will be displayed to other participants
                </p>
              </div>

              <Button 
                onClick={handleJoin} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Joining..." : "Join Contest"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don&apos;t have a code? Ask your teacher for the contest code.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 