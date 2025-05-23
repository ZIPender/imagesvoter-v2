import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImagePair {
  id: string;
  aiImageUrl: string;
  realImageUrl: string;
  participant: {
    nickname: string;
  };
}

interface ImagePairManagerProps {
  contestId: string;
  imagePairs: ImagePair[];
  onImagePairsUpdate: () => void;
}

export function ImagePairManager({ contestId, imagePairs, onImagePairsUpdate }: ImagePairManagerProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [realImage, setRealImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string>("");
  const [realImagePreview, setRealImagePreview] = useState<string>("");

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

      const response = await fetch(`/api/contest/${contestId}/teacher-upload`, {
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
      onImagePairsUpdate();
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

  async function deleteImagePair(pairId: string) {
    try {
      const authData = localStorage.getItem("teacherAuth");
      if (!authData) return;

      const { token } = JSON.parse(authData);

      const response = await fetch(`/api/contest/${contestId}/submissions/${pairId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete image pair");
      }

      toast({
        title: "Success!",
        description: "Image pair deleted successfully.",
      });

      onImagePairsUpdate();
    } catch (error) {
      console.error("Error deleting image pair:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete image pair. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add Image Pair
          </CardTitle>
          <CardDescription>
            Upload an AI-generated image and a real photo for students to vote on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Image Upload */}
            <div>
              <Label htmlFor="ai-image-inline">AI Generated Image</Label>
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
                      id="ai-image-inline"
                      type="file"
                      accept="image/*"
                      onChange={handleAiImageChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("ai-image-inline")?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Real Image Upload */}
            <div>
              <Label htmlFor="real-image-inline">Real Photo</Label>
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
                      id="real-image-inline"
                      type="file"
                      accept="image/*"
                      onChange={handleRealImageChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("real-image-inline")?.click()}
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
                <Card key={pair.id} className="relative group">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteImagePair(pair.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
    </div>
  );
} 