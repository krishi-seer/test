'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function VoiceSignupWithFace() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<SignupPhase>('voice');
  const [signupData, setSignupData] = useState<SignupData>({
    name: '',
    mobile: '',
    location: '',
    crops: '',
  });
  const [error, setError] = useState('');

  const handleVoiceComplete = async (data: Omit<SignupData, 'faceDescriptor' | 'photo'>) => {
    // Voice form completed, now move to face capture
    setSignupData((prev) => ({ ...prev, ...data }));
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
          name: signupData.name,
          mobile: signupData.mobile,
          location: signupData.location,
          crops: signupData.crops,
          faceDescriptor: Array.from(face.descriptor), // Convert Float32Array to array for JSON
          photo: face.photo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      setPhase('success');
    } catch (err: any) {
      setError(err.message);
      setPhase('face-capture');
    }
  };

  if (phase === 'voice') {
    return (
      <VoiceSignupForm
        onComplete={handleVoiceComplete}
        hideSubmit
      />
    );
  }

  if (phase === 'face-capture') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        <FaceDetectionCamera
          onFaceDetected={handleFaceDetected}
          onError={(err) => setError(err)}
          title="अपनी फोटो खींचिए / Take Your Photo"
          subtitle="कैमरे की ओर सीधे देखें। यह फोटो आपकी पहचान के लिए सुरक्षित रखी जाएगी।"
        />

        {error && (
          <div className="mt-6 max-w-2xl p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 font-bold underline"
            >
              दोबारा कोशिश करें
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 animate-spin">
            <div className="text-6xl">⏳</div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            आपकी जानकारी भेजी जा रही है...
          </h1>
          <p className="text-lg text-green-700">
            कृपया प्रतीक्षा करें
          </p>
        </div>
      </div>
    );
  }

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
            {signupData.name}, आप अब Krishi-Seer का हिस्सा हैं!
          </p>
          <div className="bg-white rounded-2xl p-6 space-y-3 text-left shadow-lg border-2 border-green-200 mb-6">
            <div>
              <p className="text-sm text-gray-600">नाम / Name</p>
              <p className="text-xl font-semibold text-green-900">{signupData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">मोबाइल / Mobile</p>
              <p className="text-xl font-semibold text-green-900">{signupData.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">स्थान / Location</p>
              <p className="text-xl font-semibold text-green-900">{signupData.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">फसलें / Crops</p>
              <p className="text-xl font-semibold text-green-900">{signupData.crops}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">✓ चेहरा सुरक्षित सहेजा गया</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            डैशबोर्ड पर जाएं →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
