import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceAuthOptions {
  language?: 'hi' | 'mr' | 'or' | 'en';
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onComplete?: (finalTranscript: string) => void;
}

interface BhashiniWebSocketMessage {
  timestamp: number;
  type: 'start' | 'data' | 'end' | 'error';
  data?: {
    transcript?: string;
    confidence?: number;
    is_final?: boolean;
  };
  error?: string;
}

export function useVoiceAuth(options: VoiceAuthOptions = {}) {
  const { language = 'hi', onTranscript, onError, onComplete } = options;

  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Bhashini API configuration
  const bhashiniConfig = {
    url: 'wss://api.bhashini.gov.in/streaming/asr',
    apiKey: process.env.NEXT_PUBLIC_BHASHINI_API_KEY,
    language: {
      hi: 'hi',
      mr: 'mr',
      or: 'or',
      en: 'en'
    }[language] || 'hi'
  };

  // Fallback to Whisper API
  const whisperConfig = {
    url: '/api/speech-to-text', // Our Next.js API route
    language: language
  };

  const connectToBhashini = useCallback(async (): Promise<WebSocket | null> => {
    if (!bhashiniConfig.apiKey) {
      console.warn('Bhashini API key not found, falling back to Whisper');
      return null;
    }

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(bhashiniConfig.url);

        ws.onopen = () => {
          console.log('Connected to Bhashini WebSocket');

          // Send initialization message
          const initMessage = {
            timestamp: Date.now(),
            type: 'start',
            data: {
              language: bhashiniConfig.language,
              api_key: bhashiniConfig.apiKey,
              format: 'audio/wav',
              encoding: 'linear16',
              sample_rate: 16000
            }
          };

          ws.send(JSON.stringify(initMessage));
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const message: BhashiniWebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case 'data':
                if (message.data?.transcript) {
                  const newTranscript = message.data.transcript;
                  setTranscript(newTranscript);
                  onTranscript?.(newTranscript);

                  if (message.data.is_final) {
                    onComplete?.(newTranscript);
                  }
                }
                break;

              case 'error':
                console.error('Bhashini error:', message.error);
                setError(message.error || 'Speech recognition error');
                onError?.(message.error || 'Speech recognition error');
                break;

              case 'end':
                console.log('Bhashini session ended');
                break;
            }
          } catch (err) {
            console.error('Failed to parse Bhashini message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('Bhashini WebSocket error:', error);
          resolve(null); // Fallback to Whisper
        };

        ws.onclose = () => {
          console.log('Bhashini WebSocket closed');
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            resolve(null);
          }
        }, 5000);

      } catch (err) {
        console.error('Failed to create Bhashini WebSocket:', err);
        resolve(null);
      }
    });
  }, [bhashiniConfig, onTranscript, onError, onComplete]);

  const fallbackToWhisper = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', whisperConfig.language);

      const response = await fetch(whisperConfig.url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const result = await response.json();
      const transcript = result.transcript || '';

      setTranscript(transcript);
      onTranscript?.(transcript);
      onComplete?.(transcript);

    } catch (err) {
      console.error('Whisper fallback failed:', err);
      setError('Speech recognition failed');
      onError?.('Speech recognition failed');
    }
  }, [whisperConfig, onTranscript, onError, onComplete]);

  const startListening = useCallback(async () => {
    if (isListening || isConnecting) return;

    setIsConnecting(true);
    setError(null);
    setTranscript('');

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Try Bhashini first
      const ws = await connectToBhashini();

      if (ws) {
        wsRef.current = ws;
        setIsConnecting(false);
        setIsListening(true);

        // Set up audio recording for Bhashini
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            // Convert WebM to WAV if needed (simplified)
            ws.send(event.data);
          }
        };

        mediaRecorder.start(100); // Send data every 100ms

      } else {
        // Fallback to Whisper
        console.log('Using Whisper fallback');

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current = mediaRecorder;
        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          fallbackToWhisper(audioBlob);
          audioChunks = [];
        };

        mediaRecorder.start();
        setIsConnecting(false);
        setIsListening(true);

        // Auto-stop after 10 seconds for Whisper
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            stopListening();
          }
        }, 10000);
      }

    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Microphone access denied');
      onError?.('Microphone access denied');
      setIsConnecting(false);
    }
  }, [isListening, isConnecting, connectToBhashini, fallbackToWhisper, onError]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    setIsListening(false);

    // Stop WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isConnecting,
    transcript,
    error,
    startListening,
    stopListening,
  };
}