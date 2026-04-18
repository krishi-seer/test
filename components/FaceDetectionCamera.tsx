'use client';

import React, { useRef, useEffect, useState } from 'react';

/**
 * FaceDetectionCamera
 *
 * Uses face-api.js to detect faces and extract 128-dimensional descriptors.
 * Captures a photo and calls onFaceDetected with both.
 *
 * Required: Download face-api.js models to /public/models/
 */

interface DetectedFace {
  descriptor: Float32Array;  // 128-d vector
  photo: string;              // Base64 data URL
  confidence: number;         // Detection confidence (0-1)
  landmarks: {
    x: number;
    y: number;
  }[];
}

interface Props {
  onFaceDetected: (face: DetectedFace) => void;
  onError?: (error: string) => void;
  title?: string;
  subtitle?: string;
}

export default function FaceDetectionCamera({
  onFaceDetected,
  onError,
  title = 'फोटो खींचिए / Take a Photo',
  subtitle = 'अपना चेहरा कैमरे के सामने रखिए',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceapiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('मॉडल लोड हो रहे हैं...');
  const [faceapiLoaded, setFaceapiLoaded] = useState(false);

  useEffect(() => {
    const loadFaceApi = async () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).faceapi) return (window as any).faceapi;

      const existing = document.querySelector('script[data-faceapi]');
      if (existing) {
        return new Promise((resolve, reject) => {
          if ((window as any).faceapi) return resolve((window as any).faceapi);
          existing.addEventListener('load', () => resolve((window as any).faceapi));
          existing.addEventListener('error', () => reject(new Error('Failed to load face-api script')));
        });
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js';
        script.async = true;
        script.dataset.faceapi = 'true';
        script.onload = () => {
          if ((window as any).faceapi) return resolve((window as any).faceapi);
          reject(new Error('faceapi not available after script load'));
        };
        script.onerror = () => reject(new Error('Failed to load face-api script'));
        document.body.appendChild(script);
      });
    };

    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        const BACKUP_MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        const faceapi = await loadFaceApi();
        if (!faceapi || !faceapi.nets) {
          throw new Error('faceapi runtime not available');
        }
        faceapiRef.current = faceapi;

        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          console.log('Loaded face-api models from', MODEL_URL);
        } catch (localErr) {
          console.warn('Local models failed, trying CDN backup:', localErr);
          // Try loading from public CDN as a fallback
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(BACKUP_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(BACKUP_MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(BACKUP_MODEL_URL),
          ]);
          console.log('Loaded face-api models from backup CDN', BACKUP_MODEL_URL);
        }

        setFaceapiLoaded(true);
        setDetectionMessage('कैमरा शुरू हो रहा है...');
      } catch (error) {
        console.error('Failed to load face-api models:', error);
        onError?.('Failed to load face recognition models');
        setDetectionMessage('मॉडल लोड करने में विफल');
        setIsLoading(false);
      }
    };

    loadModels();
  }, [onError]);

  // Initialize camera
  useEffect(() => {
    if (!faceapiLoaded || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        videoRef.current!.srcObject = stream;
        videoRef.current!.onloadedmetadata = () => {
          videoRef.current!.play();
          setIsLoading(false);
          setDetectionMessage('चेहरा ढूंढ रहा है...');
        };
      } catch (error) {
        console.error('Camera access failed:', error);
        onError?.('Camera access denied');
        setDetectionMessage('कैमरा एक्सेस अस्वीकृत');
        setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [faceapiLoaded, onError]);

  // Face detection loop
  useEffect(() => {
    if (!faceapiLoaded || isLoading || !videoRef.current || !canvasRef.current || !faceapiRef.current) return;

    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFace = async () => {
      if (!video || video.paused || video.ended) return;

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const detection = detections[0]; // Use first face

          // Draw bounding box
          const { x, y, width, height } = detection.detection.box;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw landmarks
          ctx.fillStyle = '#16a34a';
          detection.landmarks.positions.forEach((point: any) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });

          setDetectionMessage('चेहरा मिल गया! फोटो खींचने के लिए तैयार...');
          setIsDetecting(true);
        } else {
          setDetectionMessage('चेहरा ढूंढ रहा है...');
          setIsDetecting(false);
        }

        requestAnimationFrame(detectFace);
      } catch (error) {
        console.error('Face detection error:', error);
        setDetectionMessage('चेहरा पहचान में त्रुटि');
      }
    };

    detectFace();
  }, [faceapiLoaded, isLoading, onError]);

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Capture photo
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/jpeg', 0.9);

      // Detect face in captured image
      const detections = await faceapiRef.current
        .detectAllFaces(canvas, new faceapiRef.current.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        const detection = detections[0];

        const face: DetectedFace = {
          descriptor: detection.descriptor,
          photo,
          confidence: detection.detection.score,
          landmarks: detection.landmarks.positions.map((p: any) => ({ x: p.x, y: p.y })),
        };

        onFaceDetected(face);
      } else {
        onError?.('No face detected in photo');
      }
    } catch (error) {
      console.error('Capture error:', error);
      onError?.('Failed to capture photo');
    }
  };

  return (
    <div className="relative">
      {/* Camera container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-amber-50 to-orange-50 border-4 border-green-200 shadow-2xl">
        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }} // Mirror for natural feel
        />

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-amber-900/80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-semibold">{detectionMessage}</p>
            </div>
          </div>
        )}

        {/* Detection status */}
        {!isLoading && (
          <div className="absolute top-4 left-4 right-4 bg-black/50 text-white p-3 rounded-2xl backdrop-blur-sm">
            <p className="text-center text-sm font-medium">{detectionMessage}</p>
          </div>
        )}

        {/* Capture button */}
        {isDetecting && !isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={captureAndDetect}
              className="bg-white text-green-700 px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-4 border-green-300"
            >
              📸 फोटो खींचिए
            </button>
          </div>
        )}
      </div>

      {/* Title and subtitle */}
      <div className="mt-6 text-center">
        <h2 className="text-2xl font-bold text-green-900 mb-2">{title}</h2>
        <p className="text-green-700">{subtitle}</p>
      </div>
    </div>
  );
}
