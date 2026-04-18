'use client';

import React, { useState } from 'react';
import VoiceSignupForm from './VoiceSignupForm';
import FaceDetectionCamera from './FaceDetectionCamera';

interface SignupData {
  name: string;
  mobile: string;
  location: string;
  crops: string;
  faceDescriptor?: Float32Array;
  photo?: string;
}

type SignupPhase = 'voice' | 'face-capture' | 'submitting' | 'success';

type Farmer = Record<string, string>;

export default function VoiceSignupWithFace() {
  const [phase, setPhase] = useState<SignupPhase>('voice');
  const [signupData, setSignupData] = useState<SignupData>({
    name: '',
    mobile: '',
    location: '',
    crops: '',
  });
  const [error, setError] = useState('');

  const handleVoiceComplete = async (data: Farmer) => {
    // Voice form completed, now move to face capture
    setSignupData((prev) => ({ 
      ...prev, 
      name: data.name || '',
      mobile: data.mobile || '',
      location: data.location || '',
      crops: data.crops || '',
    }));
    setPhase('face-capture');
  };

  const handleFaceDetected = async (face: {
    descriptor: Float32Array;
    photo: string;
    confidence: number;
  }) => {
    setSignupData((prev) => ({
      ...prev,
      faceDescriptor: face.descriptor,
      photo: face.photo,
    }));

    // Submit to backend
    setPhase('submitting');
    try {
      const response = await fetch('/api/auth/voice-signup-with-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          faceDescriptor: Array.from(face.descriptor), // Convert to array for JSON
          photo: face.photo,
        }),
      });

      if (response.ok) {
        setPhase('success');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Signup failed');
        setPhase('face-capture'); // Go back to face capture on error
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
      setPhase('face-capture'); // Go back to face capture on error
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 animate-bounce">
            <div className="text-6xl">🎉</div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            स्वागत है! Welcome!
          </h1>
          <p className="text-lg text-green-700 mb-6">
            आपका रजिस्ट्रेशन पूरा हो गया है। अब आप Krishi-Seer का हिस्सा हैं!
          </p>

          {/* Profile summary */}
          <div className="bg-white rounded-2xl p-6 space-y-4 text-left shadow-lg border-2 border-green-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👤</span>
              <div>
                <p className="text-sm text-gray-600">नाम</p>
                <p className="text-xl font-semibold text-green-900">{signupData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📱</span>
              <div>
                <p className="text-sm text-gray-600">मोबाइल</p>
                <p className="text-xl font-semibold text-green-900">{signupData.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📍</span>
              <div>
                <p className="text-sm text-gray-600">स्थान</p>
                <p className="text-xl font-semibold text-green-900">{signupData.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">K</span>
              <div>
                <p className="text-sm text-gray-600">फसलें</p>
                <p className="text-xl font-semibold text-green-900">{signupData.crops}</p>
              </div>
            </div>
            {signupData.photo && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">आपकी फोटो</p>
                <img
                  src={signupData.photo}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-green-300"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            डैशबोर्ड पर जाएं
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">रजिस्ट्रेशन हो रहा है...</h2>
          <p className="text-green-700">कृपया प्रतीक्षा करें</p>
        </div>
      </div>
    );
  }

  if (phase === 'face-capture') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 inline-block">
              <div className="text-5xl">📸</div>
            </div>
            <h1 className="text-4xl font-bold text-green-900 mb-2">
              अब आपकी फोटो लें
            </h1>
            <p className="text-green-700">
              अपना चेहरा कैमरे के सामने रखें और फोटो खींचें
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Face detection camera */}
          <FaceDetectionCamera
            onFaceDetected={handleFaceDetected}
            onError={handleError}
            title="फोटो खींचिए"
            subtitle="अपना चेहरा कैमरे के सामने रखें"
          />

          {/* Back button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setPhase('voice')}
              className="text-green-700 hover:text-green-900 font-semibold underline"
            >
              ← वापस आवाज रजिस्ट्रेशन पर जाएं
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: voice phase
  return (
    <VoiceSignupForm
      onComplete={handleVoiceComplete}
      hideSubmit={true}
    />
  );
}
