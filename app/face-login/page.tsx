'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FaceDetectionCamera from '@/components/FaceDetectionCamera';

type LoginPhase = 'choice' | 'face-login' | 'verifying' | 'error' | 'voice-signup';

export default function FaceLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<LoginPhase>('choice');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (phase === 'voice-signup') {
      router.push('/voice-signup');
    }
  }, [phase, router]);

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
      router.push('/dashboard');
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

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left mb-8 gap-4">
          <div>
            <div className="mb-4 inline-block">
              <div className="text-5xl">🌾</div>
            </div>
            <h1 className="text-4xl font-bold text-green-900 mb-2">
              {t('face_login.welcome_title')}
            </h1>
            <p className="text-green-700">
              {t('face_login.welcome_desc')}
            </p>
          </div>
          <div className="self-center">
            <LanguageSwitcher />
          </div>
        </div>

          {/* Login options */}
          <div className="space-y-4">
            <button
              onClick={() => setPhase('face-login')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">📸</span>
                <span>{t('face_login.button_face_login')}</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-white text-green-700 border-2 border-green-300 font-semibold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🔐</span>
                <span>{t('face_login.button_password_login')}</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/voice-signup')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🎤</span>
                <span>{t('face_login.button_new_account')}</span>
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🌱</div>
              <h3 className="font-semibold text-green-900 mb-1">फसल सलाह</h3>
              <p className="text-sm text-green-700">बेहतर उपज के लिए विशेषज्ञ सलाह</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-semibold text-green-900 mb-1">मौसम पूर्वानुमान</h3>
              <p className="text-sm text-green-700">सटीक मौसम जानकारी</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="font-semibold text-green-900 mb-1">सरकारी योजनाएं</h3>
              <p className="text-sm text-green-700">सभी लाभकारी योजनाओं की जानकारी</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'face-login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        {/* Decorative background */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left mb-8 gap-4">
            <div>
              <div className="mb-4 inline-block">
                <div className="text-5xl">📸</div>
              </div>
              <h1 className="text-4xl font-bold text-green-900 mb-2">
                {t('face_login.face_login_title')}
              </h1>
              <p className="text-green-700">
                {t('face_login.face_login_subtitle')}
              </p>
            </div>
            <div className="self-center">
              <LanguageSwitcher />
            </div>
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
            onError={(err) => setError(err)}
            title="फेस लॉगिन"
            subtitle="अपना चेहरा कैमरे के सामने रखें"
          />

          {/* Back button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setPhase('choice')}
              className="text-green-700 hover:text-green-900 font-semibold underline"
            >
              ← {t('face_login.button_back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-500 border-t-transparent"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">चेहरा पहचान हो रही है...</h2>
          <p className="text-green-700">कृपया प्रतीक्षा करें</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
        {/* Decorative background */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Error display */}
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-red-900 mb-2">
              {t('face_login.error_title')}
            </h1>
            <p className="text-red-700 mb-6">
              {error}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setPhase('face-login')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {t('face_login.button_retry')}
              </button>

              <button
                onClick={() => setPhase('choice')}
                className="w-full bg-white text-green-700 border-2 border-green-300 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {t('face_login.button_back')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
