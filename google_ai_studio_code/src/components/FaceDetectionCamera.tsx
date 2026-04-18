'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

/**
 * FaceDetectionCamera
 * 
 * Uses face-api.js to detect faces and extract 128-dimensional descriptors.
 * Captures a photo and calls onFaceDetected with both.
 * 
 * Required: Download face-api.js models to /public/models/
 * See setup instructions below.
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('मॉडल लोड हो रहे हैं...');
  const [faceapiLoaded, setFaceapiLoaded] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        if (!faceapi) {
          throw new Error('face-api.js not loaded. Check /public/models/');
        }

        // Load the pre-trained models
        const MODEL_URL = '/models/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setFaceapiLoaded(true);
        setDetectionMessage('कैमरा खुल रहा है...');

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsLoading(false);
            setDetectionMessage('अपना चेहरा दिखाइए');
          };
        }
      } catch (err: any) {
        const msg = `Failed to load face detection: ${err.message}`;
        setDetectionMessage(msg);
        onError?.(msg);
      }
    };

    loadModels();

    return () => {
      // Stop camera on unmount
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !faceapiLoaded) {
      onError?.('Camera not ready');
      return;
    }

    setIsDetecting(true);
    setDetectionMessage('चेहरा खोज रहे हैं...');

    try {
      // Set canvas dimensions to match video
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      // Draw current frame
      ctx.drawImage(videoRef.current, 0, 0);

      // Detect faces using TinyFaceDetector (fast + lightweight)
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        setDetectionMessage('चेहरा नहीं मिला। पुनः प्रयास करें।');
        setIsDetecting(false);
        return;
      }

      // Get the most confident detection
      const detection = detections.reduce((prev, current) =>
        current.detection.score > prev.detection.score ? current : prev
      );

      if (detection.detection.score < 0.5) {
        setDetectionMessage('चेहरा स्पष्ट नहीं है। पुनः प्रयास करें।');
        setIsDetecting(false);
        return;
      }

      // Extract data
      const descriptor = detection.descriptor;
      const landmarks = detection.landmarks.positions.map((pos: any) => ({
        x: pos.x,
        y: pos.y,
      }));

      // Capture photo as base64
      const photo = canvasRef.current.toDataURL('image/jpeg', 0.8);

      setDetectionMessage('✓ चेहरा पहचाना गया!');

      // Call parent callback
      onFaceDetected({
        descriptor,
        photo,
        confidence: detection.detection.score,
        landmarks,
      });

      // Stop video after successful detection
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    } catch (err: any) {
      const msg = `Detection error: ${err.message}`;
      setDetectionMessage(msg);
      onError?.(msg);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-green-900 mb-2">{title}</h2>
        <p className="text-green-700">{subtitle}</p>
      </div>

      {/* Video Container */}
      <div className="relative bg-black rounded-3xl overflow-hidden border-4 border-green-400 shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-spin">⏳</div>
              <p className="text-white text-lg">{detectionMessage}</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto aspect-video object-cover"
        />

        {/* Status overlay */}
        <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
          {isDetecting ? '🔍 स्कैनिंग...' : '✓ तैयार'}
        </div>

        {/* Message overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full inline-block">
            {detectionMessage}
          </div>
        </div>

        {/* Capture button */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={captureAndDetect}
            disabled={isLoading || isDetecting}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 transition-all duration-200 animate-pulse"
          >
            📸
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
        <p className="text-sm text-blue-900 font-semibold">📷 निर्देश / Instructions:</p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1">
          <li>✓ अच्छी रोशनी में सीधे कैमरे की ओर देखें</li>
          <li>✓ अपना पूरा चेहरा दिखाएं (आधा नहीं)</li>
          <li>✓ चश्मे हटाएं (यदि संभव हो)</li>
          <li>✓ कैमरे से 30-60 सेमी दूर रहें</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * HOW TO SETUP:
 * 
 * 1. Download face-api.js models:
 *    ```bash
 *    mkdir -p public/models
 *    cd public/models
 *    # Download these 6 files from:
 *    # https://github.com/vladmandic/face-api/tree/master/model
 *    
 *    - tiny_face_detector_model-weights_manifest.json
 *    - tiny_face_detector_model-weights_shard_1of1.bin
 *    - face_landmark_68_model-weights_manifest.json
 *    - face_landmark_68_model-weights_shard_1of1.bin
 *    - face_recognition_model-weights_manifest.json
 *    - face_recognition_model-weights_shard_1of1.bin
 *    ```
 * 
 * 2. Add script to layout.tsx or _app.tsx:
 *    ```tsx
 *    <script
 *      async
 *      src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js"
 *    ></script>
 *    ```
 * 
 * 3. Or use npm package:
 *    ```bash
 *    npm install @vladmandic/face-api
 *    ```
 *    Then import: import * as faceapi from '@vladmandic/face-api'
 */
