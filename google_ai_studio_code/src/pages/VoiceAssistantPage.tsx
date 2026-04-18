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
    
    r.onend = () => {
      setListening(false);
      if (transcript.trim()) {
        processVoiceInput(transcript.trim());
      }
    };
    
    r.onerror = (e: any) => {
      setError(`Speech recognition error: ${e.error}`);
      setListening(false);
    };
    
    recognitionRef.current = r;
    
    return () => {
      r.stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [language]);

  const startListening = async () => {
    try {
      setError(null);
      setTranscript("");
      
      // Setup audio visualization
      if (!audioContextRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        
        // Start volume monitoring
        const updateVolume = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolumeLevel(average);
          if (listening) requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
      
      const r = recognitionRef.current;
      if (!r) throw new Error("Speech recognition not available");
      
      r.lang = language;
      r.start();
      setListening(true);
    } catch (error) {
      setError(`Error starting speech recognition: ${error}`);
    }
  };
  
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setVolumeLevel(0);
    } catch (error) {
      setError(`Error stopping speech recognition: ${error}`);
    }
  };

  const processVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language,
          messages: [
            {
              role: "system",
              content: `You are a voice-based agricultural assistant. Provide concise, clear responses suitable for voice interaction. Focus on practical farming advice, weather information, crop management, and agricultural schemes. Keep responses under 100 words for voice clarity.`
            },
            { role: "user", content: text }
          ],
        }),
      });
      
      if (!res.body) throw new Error("No response stream");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.replace(/^data:\s*/, "");
          if (data === "[DONE]") break;
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content || parsed?.delta || "";
            if (delta) {
              aiResponse += delta;
            }
          } catch {}
        }
      }
      
      if (aiResponse.trim()) {
        const conversation: Conversation = {
          id: Date.now().toString(),
          userText: text,
          aiResponse: aiResponse.trim(),
          timestamp: new Date(),
          language
        };
        
        setConversations(prev => [conversation, ...prev].slice(0, 10)); // Keep last 10 conversations
        await speakResponse(aiResponse.trim());
      } else {
        // Fallback response if no AI response
        const fallbackResponse = language.startsWith('hi') 
          ? "मैं आपकी बात समझ गया हूं। कृषि के बारे में और पूछें।"
          : language.startsWith('or')
          ? "ମୁଁ ଆପଣଙ୍କ କଥା ବୁଝିଛି। କୃଷି ବିଷୟରେ ଅଧିକ ପଚାରନ୍ତୁ।"
          : "I understand your question. Please ask more about farming.";
        
        const conversation: Conversation = {
          id: Date.now().toString(),
          userText: text,
          aiResponse: fallbackResponse,
          timestamp: new Date(),
          language
        };
        
        setConversations(prev => [conversation, ...prev].slice(0, 10));
        await speakResponse(fallbackResponse);
      }
    } catch (error) {
      setError(`Error processing voice input: ${error}`);
      const fallbackResponse = "I'm sorry, I couldn't process that. Please try again.";
      
      const conversation: Conversation = {
        id: Date.now().toString(),
        userText: text,
        aiResponse: fallbackResponse,
        timestamp: new Date(),
        language
      };
      
      setConversations(prev => [conversation, ...prev].slice(0, 10));
      await speakResponse(fallbackResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current || !text.trim()) {
        resolve();
        return;
      }
      
      // Stop any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setError("Speech synthesis error");
        resolve();
      };
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    });
  };
  
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };
  
  const repeatLastResponse = () => {
    const lastConversation = conversations[0];
    if (lastConversation) {
      speakResponse(lastConversation.aiResponse);
    }
  };
  
  const clearHistory = () => {
    setConversations([]);
    setTranscript("");
    setError(null);
  };

  const getLanguageDisplayName = (langCode: string) => {
    const languages: { [key: string]: string } = {
      "hi-IN": "हिंदी (Hindi)",
      "or-IN": "ଓଡ଼ିଆ (Odia)",
      "en-US": "English"
    };
    return languages[langCode] || langCode;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t("voice_assistant")}</h1>
                <p className="text-sm text-gray-600">Agricultural Voice Assistant with AI</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={clearHistory}
              className="bg-white/50 hover:bg-white/80 border-gray-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </Button>
          </div>
        </div>

        {/* Voice Controls */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            {/* Language Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Language</label>
              <select 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                disabled={listening || isProcessing}
              >
                <option value="hi-IN">हिंदी (Hindi)</option>
                <option value="or-IN">ଓଡ଼ିଆ (Odia)</option>
                <option value="en-US">English</option>
              </select>
            </div>

            {/* Main Voice Control */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                  listening 
                    ? 'bg-gradient-to-r from-red-400 to-red-600 shadow-lg scale-110' 
                    : isProcessing
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg'
                    : 'bg-gradient-to-r from-purple-400 to-purple-600 shadow-md hover:shadow-lg'
                }`}>
                  <button
                    onClick={listening ? stopListening : startListening}
                    disabled={isProcessing}
                    className="w-full h-full rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 disabled:cursor-not-allowed"
                  >
                    {listening ? (
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                    ) : isProcessing ? (
                      <svg className="w-12 h-12 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Volume Level Indicator */}
                {listening && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                        style={{ width: `${Math.min(volumeLevel * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-800">
                  {listening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
                </p>
                <p className="text-sm text-gray-600">
                  {listening 
                    ? `Speaking in ${getLanguageDisplayName(language)}` 
                    : isProcessing
                    ? 'Getting AI response...'
                    : `Ready to listen in ${getLanguageDisplayName(language)}`
                  }
                </p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={repeatLastResponse}
                disabled={conversations.length === 0 || isPlaying}
                className="bg-white/50 hover:bg-white/80 border-gray-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Repeat
              </Button>
              
              {isPlaying && (
                <Button
                  variant="outline"
                  onClick={stopSpeaking}
                  className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                  Stop
                </Button>
              )}
            </div>

            {/* Current Transcript */}
            {transcript && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-1">You said:</p>
                <p className="text-blue-900">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                <p className="text-red-900">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conversations.map((conv) => (
                <div key={conv.id} className="border border-gray-100 rounded-xl p-4 bg-white/50">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">You:</p>
                        <p className="text-gray-800">{conv.userText}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-600">AI Assistant:</p>
                          <button
                            onClick={() => speakResponse(conv.aiResponse)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Play response"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-gray-800">{conv.aiResponse}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{getLanguageDisplayName(conv.language)}</span>
                      <span>{conv.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use Voice Assistant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <p>• <span className="font-medium">Tap the microphone</span> to start speaking</p>
              <p>• <span className="font-medium">Ask about crops</span>, weather, diseases, schemes</p>
              <p>• <span className="font-medium">Switch languages</span> for better understanding</p>
            </div>
            <div className="space-y-2">
              <p>• <span className="font-medium">Wait for the response</span> and listen carefully</p>
              <p>• <span className="font-medium">Use 'Repeat'</span> to hear the last answer again</p>
              <p>• <span className="font-medium">Clear history</span> to start fresh</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


