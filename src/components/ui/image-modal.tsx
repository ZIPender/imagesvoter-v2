"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiImageUrl: string;
  realImageUrl: string;
  participantName?: string;
  initialImage?: "ai" | "real";
}

export function ImageModal({ 
  isOpen, 
  onClose, 
  aiImageUrl, 
  realImageUrl, 
  participantName,
  initialImage = "ai" 
}: ImageModalProps) {
  const [currentImage, setCurrentImage] = useState<"ai" | "real">(initialImage);

  const toggleImage = () => {
    setCurrentImage(currentImage === "ai" ? "real" : "ai");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full bg-black flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 text-white p-4 flex justify-between items-center">
            <div>
              {participantName && (
                <h3 className="font-semibold">{participantName}</h3>
              )}
              <p className="text-sm text-gray-300">
                {currentImage === "ai" ? "AI Generated Image" : "Real Photo"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20">
            <img
              src={currentImage === "ai" ? aiImageUrl : realImageUrl}
              alt={currentImage === "ai" ? "AI generated" : "Real photo"}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4">
            <div className="flex justify-center items-center space-x-4">
              <Button
                variant="ghost"
                onClick={toggleImage}
                className="text-white hover:bg-white/20 flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>
                  {currentImage === "ai" ? "View Real Photo" : "View AI Image"}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center mt-2 space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentImage === "ai" ? "bg-white" : "bg-white/40"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  currentImage === "real" ? "bg-white" : "bg-white/40"
                }`}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 