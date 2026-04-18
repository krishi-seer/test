'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaceDetectionCamera from '@/components/FaceDetectionCamera';

type LoginPhase = 'choice' | 'face-login' | 'verifying' | 'error' | 'voice-signup';

export default function FaceLoginPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<LoginPhase>('choice');
  const [error, setError] = useState('');

  const handleFaceDetected = async (face: {
    descriptor: Float32Array;
    photo: string;
    confidence: number;
  }) => {
    setPhase('verifying');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceDescriptor: Array.from(face.descriptor),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Face not recognized');
      }

      // Face matched! User is logged in
      // Backend sets session cookie automatically
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setPhase('error');
    }
  };

  if (phase === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        {/* Decorative background */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-4 inline-block">
              <div className="text-6xl">🌾</div>
            </div>
            <h1 className="text-4xl font-bold text-green-900 mb-2">
              Krishi-Seer में आपका स्वागत है
            </h1>
            <p className="text-green-700 text-lg">
              अपने चेहरे या आवाज़ से लॉगिन करें
            </p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            {/* Face Login Button */}
            <button
              onClick={() => setPhase('face-login')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg flex flex-col items-center gap-3"
            >
              <span className="text-4xl">👤</span>
              <span>अपना चेहरा दिखाकर लॉगिन करें</span>
              <span className="text-sm opacity-80">बस कैमरे की ओर देखें</span>
            </button>

            {/* Voice Signup Button */}
            <button
              onClick={() => navigate('/voice-signup')}
              className="w-full bg-white text-green-700 border-2 border-green-400 font-bold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg flex flex-col items-center gap-3"
            >
              <span className="text-4xl">🎤</span>
              <span>नए सदस्य के रूप में साइन अप करें</span>
              <span className="text-sm opacity-80">आवाज़ से साइन अप करें</span>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
            <p className="text-sm text-blue-900">
              <strong>💡 पहली बार यहाँ?</strong> "नए सदस्य" बटन दबाएं। अपना नाम, स्थान और फसलें आवाज़ से बताएं। आपकी फोटो सुरक्षित रखी जाएगी।
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'face-login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setPhase('choice')}
            className="mb-4 text-green-700 font-semibold hover:text-green-900 flex items-center gap-2"
          >
            ← वापस जाएं
          </button>

          <FaceDetectionCamera
            onFaceDetected={handleFaceDetected}
            onError={(err) => {
              setError(err);
              setPhase('error');
            }}
            title="अपने चेहरे से लॉगिन करें"
            subtitle="कैमरे की ओर सीधे देखें"
          />
        </div>
      </div>
    );
  }

  if (phase === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 animate-spin">
            <div className="text-6xl">🔍</div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            आपकी पहचान जांची जा रही है...
          </h1>
          <p className="text-lg text-green-700">
            कृपया प्रतीक्षा करें
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="text-6xl">❌</div>
          </div>
          <h1 className="text-3xl font-bold text-red-900 mb-2">
            पहचान नहीं हुई
          </h1>
          <p className="text-lg text-red-700 mb-6">
            {error || 'आपका चेहरा मेल नहीं खा सका'}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setPhase('face-login')}
              className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition-all"
            >
              दोबारा कोशिश करें
            </button>
            <button
              onClick={() => setPhase('choice')}
              className="w-full bg-white text-green-700 border-2 border-green-400 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-all"
            >
              वापस जाएं
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-6">
            अगर आपने अभी साइन अप नहीं किया है, तो ऊपर "नए सदस्य" बटन दबाएं।
          </p>
        </div>
      </div>
    );
  }

  return null;
}
