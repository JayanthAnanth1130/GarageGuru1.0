import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startScanning = async (onResult: (barcode: string) => void) => {
    try {
      setIsScanning(true);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      
      // Create video element for preview
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      videoRef.current = video;
      
      // For demo purposes, we'll show a simple input dialog
      // In production, you'd integrate with a barcode scanning library like QuaggaJS
      const barcode = prompt("Enter barcode manually (or scan with camera):");
      
      if (barcode) {
        onResult(barcode);
      }
      
      stopScanning();
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please enter barcode manually.",
        variant: "destructive",
      });
      
      // Fallback to manual input
      const barcode = prompt("Enter barcode manually:");
      if (barcode) {
        onResult(barcode);
      }
      
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  return {
    isScanning,
    startScanning,
    stopScanning,
  };
}
