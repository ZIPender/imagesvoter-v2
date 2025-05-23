"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contest {
  id: string;
  title: string;
  contestType: string;
  status: string;
  classroom: {
    name: string;
  };
}

interface ImagePair {
  id: string;
  aiImageUrl: string;
  realImageUrl: string;
  participant: {
    nickname: string;
  };
}

export default function TeacherUploadPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contest, setContest] = useState<Contest | null>(null);
  const [imagePairs, setImagePairs] = useState<ImagePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [realImage, setRealImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string>("");
  const [realImagePreview, setRealImagePreview] = useState<string>("");

  useEffect(() => {
    loadContestData();
  }, [params.id]);

  async function loadContestData() {
    try {
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
      setImagePairs(data.submissions);

      // Check if this is a teacher upload contest
      if (data.contest.contestType !== "TEACHER_UPLOAD") {
        toast({
          title: "Access Denied",
          description: "This feature is only available for teacher upload contests.",
          variant: "destructive",
        });
        router.push(`/contest/${params.id}/manage`);
        return;
      }
    } catch (error) {
      console.error("Error loading contest data:", error);
      toast({
        title: "Error",
        description: "Failed to load contest data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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

  function clearImages() {
    setAiImage(null);
    setRealImage(null);
    setAiImagePreview("");
    setRealImagePreview("");
  }

  async function uploadImagePair() {
    if (!aiImage || !realImage) {
      toast({
        title: "Missing Images",
        description: "Please select both an AI image and a real photo.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const formData = new FormData();
      formData.append("aiImage", aiImage);
      formData.append("realImage", realImage);

      const response = await fetch(`/api/contest/${params.id}/teacher-upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      toast({
        title: "Success!",
        description: "Image pair uploaded successfully.",
      });

      clearImages();
      loadContestData();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image pair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
              <Link href={`/contest/${params.id}/manage`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Manage
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Image Pairs</h1>
                <p className="text-sm text-gray-600">
                  {contest.classroom.name} • {contest.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Image Pair
            </CardTitle>
            <CardDescription>
              Upload an AI-generated image and a real photo for students to vote on
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
                        <X className="h-4 w-4" />
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
                        <X className="h-4 w-4" />
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={clearImages}>
                Clear
              </Button>
              <Button onClick={uploadImagePair} disabled={isUploading || !aiImage || !realImage}>
                {isUploading ? "Uploading..." : "Upload Image Pair"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Image Pairs */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Image Pairs</CardTitle>
            <CardDescription>
              {imagePairs.length} image pair{imagePairs.length !== 1 ? 's' : ''} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imagePairs.length === 0 ? (
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No image pairs uploaded yet. Upload your first pair above!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imagePairs.map((pair) => (
                  <Card key={pair.id}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">AI Image</p>
                          <img
                            src={pair.aiImageUrl}
                            alt="AI generated"
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Real Photo</p>
                          <img
                            src={pair.realImageUrl}
                            alt="Real photo"
                            className="w-full h-32 object-cover rounded"
                          />
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