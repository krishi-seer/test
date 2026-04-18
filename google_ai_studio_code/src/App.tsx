/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FaceLoginPage from './pages/FaceLoginPage';
import VoiceSignupWithFace from './components/VoiceSignupWithFace';
import VoiceAssistantPage from './pages/VoiceAssistantPage';

const Dashboard = () => (
  <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
    <h1 className="text-4xl font-bold text-green-900 mb-4">किसान डैशबोर्ड / Farmer Dashboard</h1>
    <p className="text-xl text-green-700">सफलतापूर्वक लॉगिन किया गया! Your account is ready.</p>
    <div className="mt-8 grid grid-cols-2 gap-4">
      <div className="p-6 bg-white rounded-2xl shadow-md text-center">
        <span className="text-4xl mb-2 block">🌦️</span>
        <p className="font-semibold">मौसम / Weather</p>
      </div>
      <div className="p-6 bg-white rounded-2xl shadow-md text-center">
        <span className="text-4xl mb-2 block">📄</span>
        <p className="font-semibold">सरकारी योजनाएं / Schemes</p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FaceLoginPage />} />
        <Route path="/facelogin" element={<FaceLoginPage />} />
        <Route path="/voice-signup" element={<VoiceSignupWithFace />} />
        <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

