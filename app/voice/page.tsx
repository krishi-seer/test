"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

type Conversation = {
  id: string;
  userText: string;
  aiResponse: string;
  timestamp: Date;
  language: string;
};

export default function VoiceAssistantPage() {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("hi-IN");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    // Initialize speech recognition
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = language;

    r.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      setTranscript(txt);
    };

    r.onstart = () => {
      setListening(true);
      setError(null);
    };

    r.onend = () => {
      setListening(false);
    };

    r.onerror = (e: any) => {
      setError(`Speech recognition error: ${e.error}`);
      setListening(false);
    };

    recognitionRef.current = r;

    // Initialize audio context for volume visualization
    const initAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const updateVolume = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolumeLevel(average / 255);
          }
          requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) {
        console.warn("Could not initialize audio context:", err);
      }
    };

    initAudioContext();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceInput = async () => {
    if (!transcript.trim() || isProcessing) return;

    setIsProcessing(true);
    const userText = transcript;
    setTranscript("");

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          language: language,
          context: "agricultural_assistance"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.response;

      // Add to conversation history
      const newConversation: Conversation = {
        id: Date.now().toString(),
        userText,
        aiResponse,
        timestamp: new Date(),
        language,
      };

      setConversations(prev => [newConversation, ...prev]);

      // Speak the response
      speakResponse(aiResponse);
    } catch (err: any) {
      setError(`Processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    // Stop any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };

  const clearConversations = () => {
    setConversations([]);
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case "hi-IN": return "हिंदी";
      case "mr-IN": return "मराठी";
      case "or-IN": return "ଓଡ଼ିଆ";
      case "en-US": return "English";
      default: return lang;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-block">
            <div className="text-5xl">🎤</div>
          </div>
          <h1 className="text-4xl font-bold text-green-900 mb-2">
            {t("voice_assistant.title", "Voice Assistant")}
          </h1>
          <p className="text-green-700">
            {t("voice_assistant.subtitle", "Ask me anything about farming")}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 bg-white rounded-full p-1 shadow-lg">
            {["hi-IN", "mr-IN", "or-IN", "en-US"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  language === lang
                    ? "bg-green-600 text-white shadow-md"
                    : "text-green-700 hover:bg-green-50"
                }`}
              >
                {getLanguageName(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Input Section */}
        <Card className="mb-6 shadow-xl border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              {t("voice_assistant.speak", "Speak your question")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Voice Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={listening ? stopListening : startListening}
                disabled={isProcessing}
                className={`relative w-32 h-32 rounded-full font-bold text-lg transition-all duration-300 transform ${
                  listening
                    ? "bg-red-500 text-white scale-110 shadow-2xl"
                    : "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-xl hover:shadow-2xl hover:scale-105"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {listening ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2">
                    <div className="text-3xl">🎤</div>
                    <div className="text-xs">{t("voice_assistant.listening", "Listening")}</div>
                    {/* Volume visualization */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 bg-white rounded-full transition-all duration-100 ${
                            volumeLevel > (i + 1) * 0.2 ? "h-4" : "h-1"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-2">
                    <div className="text-3xl">🎤</div>
                    <div className="text-xs">{t("voice_assistant.tap_to_speak", "Tap to speak")}</div>
                  </div>
                )}

                {/* Animated ripple effect when listening */}
                {listening && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse opacity-50"></div>
                  </>
                )}
              </button>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-amber-50 rounded-xl border-2 border-green-300">
                <p className="text-sm text-gray-600 mb-2">
                  {t("voice_assistant.you_said", "You said:")}
                </p>
                <p className="text-xl font-semibold text-green-900 leading-relaxed">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={processVoiceInput}
                disabled={!transcript.trim() || isProcessing}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {isProcessing ? t("voice_assistant.processing", "Processing...") : t("voice_assistant.ask_ai", "Ask AI")}
              </Button>

              {isPlaying && (
                <Button
                  onClick={stopSpeaking}
                  className="bg-red-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("voice_assistant.stop_speaking", "Stop Speaking")}
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <Card className="shadow-xl border-2 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  {t("voice_assistant.conversation_history", "Conversation History")}
                </CardTitle>
                <Button
                  onClick={clearConversations}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {t("voice_assistant.clear", "Clear")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div key={conv.id} className="border-b border-green-100 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">👤</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {t("voice_assistant.you", "You")} • {conv.timestamp.toLocaleTimeString()}
                        </p>
                        <p className="text-green-900 font-medium">{conv.userText}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {t("voice_assistant.ai", "AI Assistant")}
                        </p>
                        <p className="text-blue-900">{conv.aiResponse}</p>
                        <button
                          onClick={() => speakResponse(conv.aiResponse)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                          disabled={isPlaying}
                        >
                          🔊 {t("voice_assistant.listen_again", "Listen again")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            {t("voice_assistant.help_text", "Try asking about crop diseases, weather, government schemes, or farming techniques")}
          </p>
        </div>
      </div>
    </div>
  );
}
 


