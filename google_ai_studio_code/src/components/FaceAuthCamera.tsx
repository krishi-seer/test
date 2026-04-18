'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceAuthCameraProps {
  onFaceDetected?: (descriptor: Float32Array) => void;
  onMatchComplete?: (result: { success: boolean; profile?: any }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function FaceAuthCamera({
  onFaceDetected,
  onMatchComplete,
  onError,
  className = ''
}: FaceAuthCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Initialize face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load models from public/models directory
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setError('Failed to load face recognition models');
        onError?.('Failed to load face recognition models');
      }
    };

    loadModels();
  }, [onError]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setIsInitialized(true);
        setIsLoading(false);
        startFaceDetection();
      };
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Camera access denied. Please allow camera permissions.');
      onError?.('Camera access denied');
      setIsLoading(false);
    }
  }, [modelsLoaded, onError]);

  // Start face detection loop
  const startFaceDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFace = async () => {
      if (!video || video.paused || video.ended) return;

      try {
        // Detect faces
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const detection = detections[0]; // Use first detected face

          // Draw face bounding box with organic styling
          const { x, y, width, height } = detection.detection.box;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Draw rounded rectangle
          const radius = 12;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.stroke();

          // Draw face landmarks as subtle dots
          ctx.fillStyle = '#16a34a';
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });

          // Update state
          if (!faceDetected) {
            setFaceDetected(true);
            setError(null);

            // Extract and process descriptor
            if (detection.descriptor && onFaceDetected) {
              onFaceDetected(detection.descriptor);
              await processFaceMatch(detection.descriptor);
            }
          }
        } else {
          if (faceDetected) {
            setFaceDetected(false);
          }
        }

        // Continue detection loop
        requestAnimationFrame(detectFace);
      } catch (err) {
        console.error('Face detection error:', err);
        setError('Face detection failed');
        onError?.('Face detection failed');
      }
    };

    detectFace();
  }, [isInitialized, faceDetected, onFaceDetected, onError]);

  // Process face matching
  const processFaceMatch = async (descriptor: Float32Array) => {
    if (isMatching) return;

    setIsMatching(true);

    try {
      // Convert Float32Array to regular array
      const embedding = Array.from(descriptor);

      // Call Supabase Edge Function
      const response = await fetch('/api/match-face-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding,
          threshold: 0.42 // Cosine distance threshold
        }),
      });

      const result = await response.json();

      if (result.success && result.match) {
        onMatchComplete?.({ success: true, profile: result.match });
      } else {
        onMatchComplete?.({ success: false });
      }
    } catch (err) {
      console.error('Face matching error:', err);
      setError('Face matching failed');
      onError?.('Face matching failed');
      onMatchComplete?.({ success: false });
    } finally {
      setIsMatching(false);
    }
  };

  // Initialize camera when models are loaded
  useEffect(() => {
    if (modelsLoaded && !isInitialized) {
      initializeCamera();
    }
  }, [modelsLoaded, isInitialized, initializeCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Camera container with organic styling */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-amber-50 to-orange-50 border-4 border-green-200 shadow-2xl">
        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }} // Mirror for natural feel
        />

        {/* Canvas overlay for face detection */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-amber-900/80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Loading camera...</p>
              <p className="text-sm opacity-80">Setting up face recognition</p>
            </div>
          </div>
        )}

        {/* Matching overlay */}
        {isMatching && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-indigo-900/90 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-white border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
              </div>
              <p className="text-2xl font-bold mb-2">Matching...</p>
              <p className="text-sm opacity-80">Searching for your profile</p>

              {/* Progress bar */}
              <div className="mt-6 w-64 mx-auto">
                <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-progress"
                       style={{
                         width: '60%'
                       }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-pink-900/90 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-xl font-bold mb-2">Error</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Face detection indicator */}
        {faceDetected && !isMatching && !error && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-bounce">
            ✓ Face Detected
          </div>
        )}

        {/* Instructions overlay */}
        {!faceDetected && !isMatching && !error && !isLoading && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-2xl backdrop-blur-sm">
            <p className="text-center text-sm">
              Position your face in the center of the camera
            </p>
          </div>
        )}
      </div>

    </div>
  );
}