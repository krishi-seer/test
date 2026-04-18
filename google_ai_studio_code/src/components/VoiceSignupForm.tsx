'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SignupStep {
  id: string;
  field: 'name' | 'location' | 'crops' | 'mobile';
  label_hi: string;
  label_en: string;
  label_mr: string;
  label_or: string;
  prompt_hi: string;
  prompt_en: string;
  prompt_mr: string;
  prompt_or: string;
}

const SIGNUP_STEPS: SignupStep[] = [
  {
    id: 'name',
    field: 'name',
    label_hi: 'नाम',
    label_en: 'Name',
    label_mr: 'नाव',
    label_or: 'ନାମ',
    prompt_hi: 'आपका नाम क्या है?',
    prompt_en: 'What is your name?',
    prompt_mr: 'तुमचे नाव काय आहे?',
    prompt_or: 'ଆପଣଙ୍କ ନାମ କ’ଣ?',
  },
  {
    id: 'mobile',
    field: 'mobile',
    label_hi: 'मोबाइल नंबर',
    label_en: 'Mobile Number',
    label_mr: 'मोबाईल नंबर',
    label_or: 'ମୋବାଇଲ୍ ନମ୍ବର',
    prompt_hi: 'आपका मोबाइल नंबर क्या है?',
    prompt_en: 'What is your mobile number?',
    prompt_mr: 'तुमचा मोबाईल नंबर काय आहे?',
    prompt_or: 'ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର କ’ଣ?',
  },
  {
    id: 'location',
    field: 'location',
    label_hi: 'स्थान',
    label_en: 'Location',
    label_mr: 'ठिकाण',
    label_or: 'ସ୍ଥାନ',
    prompt_hi: 'आप कहाँ से हैं?',
    prompt_en: 'Where are you from?',
    prompt_mr: 'तुम्ही कोठून आहात?',
    prompt_or: 'ଆପଣ କେଉଁଠାରୁ ଆସିଛନ୍ତି?',
  },
  {
    id: 'crops',
    field: 'crops',
    label_hi: 'फसलें',
    label_en: 'Crops',
    label_mr: 'पिके',
    label_or: 'ଫସଲ',
    prompt_hi: 'आप कौन सी फसलें उगाते हैं?',
    prompt_en: 'What crops do you grow?',
    prompt_mr: 'तुम्ही कोणती पिके घेता?',
    prompt_or: 'ଆପଣ କେଉଁ ଫସଲ ଚାଷ କରନ୍ତି?',
  },
];

type Farmer = Record<string, string>;

interface VoiceSignupFormProps {
  onComplete?: (data: Farmer) => void;
  hideSubmit?: boolean;
}

export default function VoiceSignupForm({ onComplete, hideSubmit = false }: VoiceSignupFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [farmer, setFarmer] = useState<Farmer>({
    name: '',
    mobile: '',
    location: '',
    crops: '',
  });
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr' | 'or'>('hi');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);

  const currentStep = SIGNUP_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / SIGNUP_STEPS.length) * 100;

  const getLangCode = (l: string) => {
    switch (l) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'or': return 'or-IN';
      default: return 'en-US';
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported on this device');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = getLangCode(language);

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcriptSegment);
        } else {
          interimText += transcriptSegment;
        }
      }
      if (interimText) {
        setTranscript(interimText);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Listening error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLangCode(language);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleConfirmAnswer = () => {
    if (!transcript.trim()) {
      setError('Please speak your answer.');
      return;
    }

    const newFarmer = {
      ...farmer,
      [currentStep.field]: transcript,
    };

    setFarmer(newFarmer);
    setTranscript('');
    setError('');

    if (currentStepIndex < SIGNUP_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Last step complete
      if (onComplete && hideSubmit) {
        // Pass to parent for face capture
        onComplete(newFarmer);
      } else {
        // Auto-submit
        handleSubmit();
      }
    }
  };

  const handleSkip = () => {
    setTranscript('');
    setError('');
    if (currentStepIndex < SIGNUP_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      if (onComplete && hideSubmit) {
        onComplete(farmer);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitted(true);
      console.log('Farmer signup data:', farmer);
    } catch (err: any) {
      setError('Signup failed: ' + err.message);
      setSubmitted(false);
    }
  };

  const getStepPrompt = () => {
    switch(language) {
      case 'hi': return currentStep.prompt_hi;
      case 'mr': return currentStep.prompt_mr;
      case 'or': return currentStep.prompt_or;
      default: return currentStep.prompt_en;
    }
  };

  const getStepLabel = (step: SignupStep) => {
    switch(language) {
      case 'hi': return step.label_hi;
      case 'mr': return step.label_mr;
      case 'or': return step.label_or;
      default: return step.label_en;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 animate-bounce">
            <div className="text-6xl">🌾</div>
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">
            स्वागत है! Welcome!
          </h1>
          <p className="text-lg text-green-700 mb-6">
            {language === 'hi'
              ? `तुम्हारा नाम ${farmer.name} है। अब तुम Krishi-Seer का हिस्सा हो!`
              : `Your name is ${farmer.name}. Welcome to Krishi-Seer!`}
          </p>
          <div className="bg-white rounded-2xl p-6 space-y-3 text-left shadow-lg border-2 border-green-200">
            {SIGNUP_STEPS.map(step => (
              <div key={step.id}>
                <p className="text-sm text-gray-600">{getStepLabel(step)}</p>
                <p className="text-xl font-semibold text-green-900">{farmer[step.field] || '---'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-block">
            <div className="text-5xl">🎤</div>
          </div>
          <h1 className="text-4xl font-bold text-green-900 mb-2">
            {language === 'hi' ? 'आपका खेत, आपकी आवाज़' : 
             language === 'mr' ? 'तुमची शेती, तुमचा आवाज' :
             language === 'or' ? 'ଆପଣଙ୍କ ଚାଷ, ଆପଣଙ୍କ ସ୍ୱର' :
             'Your Farm, Your Voice'}
          </h1>
          <p className="text-green-700">
            {language === 'hi' ? 'कुछ सवाल हैं, बस बोलिए। फिर अपनी फोटो लेंगे।' : 
             language === 'mr' ? 'काही प्रश्न आहेत, फक्त बोला. मग तुमचा फोटो घेऊ.' :
             language === 'or' ? 'ପ୍ରଶ୍ନ ଅଛି, କେବଳ କୁହନ୍ତୁ | ତା’ପରେ ଆପଣଙ୍କ ଫଟୋ ନିଅନ୍ତୁ |' :
             'Answer a few questions. Then take your photo.'}
          </p>
        </div>

        {/* Language toggle */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { id: 'hi', label: 'हिंदी' },
            { id: 'mr', label: 'मराठी' },
            { id: 'or', label: 'ଓଡ଼ିଆ' },
            { id: 'en', label: 'English' }
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id as any)}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                language === l.id
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-white text-green-700 border-2 border-green-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green-700">
              {language === 'hi' ? `चरण ${currentStepIndex + 1} / ${SIGNUP_STEPS.length}` : 
               language === 'mr' ? `टप्पा ${currentStepIndex + 1} / ${SIGNUP_STEPS.length}` :
               language === 'or' ? `ପର୍ଯ୍ୟାୟ ${currentStepIndex + 1} / ${SIGNUP_STEPS.length}` :
               `Step ${currentStepIndex + 1} / ${SIGNUP_STEPS.length}`}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-3 bg-white rounded-full overflow-hidden border-2 border-green-300 shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main form card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-green-200">
          {/* Question */}
          <div className="mb-8 text-center min-h-[4rem] flex flex-col justify-center">
            <p className="text-3xl font-bold text-green-900 mb-2">
              {getStepPrompt()}
            </p>
            <p className="text-green-700">
              {language === 'hi' ? 'माइक्रोफोन बटन दबाएं और बोलें' : 
               language === 'mr' ? 'मायक्रोफोन बटण दाबा आणि बोला' :
               language === 'or' ? 'ମାଇକ୍ରୋଫୋନ୍ ବଟନ୍ ଦବାନ୍ତୁ ଏବଂ କୁହନ୍ତୁ' :
               'Press the button below and speak'}
            </p>
          </div>

          {/* Microphone button */}
          <div className="flex justify-center mb-8">
            <button
              ref={micButtonRef}
              onClick={isListening ? stopListening : startListening}
              className={`relative w-32 h-32 rounded-full font-bold text-lg transition-all duration-300 transform ${
                isListening
                  ? 'bg-red-500 text-white scale-110 shadow-2xl'
                  : 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-xl hover:shadow-2xl hover:scale-105'
              }`}
            >
              {isListening ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 animate-pulse">
                  <div className="text-3xl">🎤</div>
                  <div className="text-xs">
                    {language === 'hi' ? 'सुन रहे हैं' : 
                     language === 'mr' ? 'ऐकत आहे' :
                     language === 'or' ? 'ଶୁଣୁଛି' :
                     'Listening'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <div className="text-3xl">🎤</div>
                  <div className="text-xs">
                    {language === 'hi' ? 'दबाएं और बोलिए' : 
                     language === 'mr' ? 'दाबा आणि बोला' :
                     language === 'or' ? 'ଦବାନ୍ତୁ ଏବଂ କୁହନ୍ତୁ' :
                     'Tap to speak'}
                  </div>
                </div>
              )}

              {/* Animated ripple effect when listening */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse opacity-50"></div>
                </>
              )}
            </button>
          </div>

          {/* Transcript display */}
          {transcript && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-amber-50 rounded-2xl border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2">
                {language === 'hi' ? 'आपने कहा:' : 
                 language === 'mr' ? 'तुम्ही म्हणालात:' :
                 language === 'or' ? 'ଆପଣ କହିଛନ୍ତି:' :
                 'You said:'}
              </p>
              <p className="text-2xl font-semibold text-green-900 leading-relaxed">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleConfirmAnswer}
              disabled={!transcript.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {language === 'hi' ? 'अगला' : 
               language === 'mr' ? 'पुढील' :
               language === 'or' ? 'ପରବର୍ତ୍ତୀ' :
               'Next'}
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              {language === 'hi' ? 'छोड़ें' : 
               language === 'mr' ? 'वगळा' :
               language === 'or' ? 'ଛାଡିଦିଅ' :
               'Skip'}
            </button>
          </div>

          {/* Helper text */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {language === 'hi' ? 'अगर सुनना बंद हो जाए, बस दोबारा दबाएं' : 
             language === 'mr' ? 'जर ऐकणे थांबले तर पुन्हा दाबा' :
             language === 'or' ? 'ଯଦି ଶୁଣିବା ବନ୍ଦ ହୋଇଯାଏ, ପୁନର୍ବାର ଦବାନ୍ତୁ' :
             'If it stops listening, just tap again'}
          </p>
        </div>

        {/* Data review */}
        {Object.values(farmer).some(v => v) && (
          <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-green-300 shadow-lg">
            <p className="text-sm text-gray-600 mb-4">
              {language === 'hi' ? 'आपकी जानकारी:' : 
               language === 'mr' ? 'तुमची माहिती:' :
               language === 'or' ? 'ଆପଣଙ୍କ ସୂଚନା:' :
               'Your info so far:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SIGNUP_STEPS.map(step => farmer[step.field] && (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <span className="text-2xl">
                    {step.field === 'name' ? '👤' : 
                     step.field === 'mobile' ? '📱' :
                     step.field === 'location' ? '📍' : '🌾'}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">{getStepLabel(step)}</p>
                    <p className="font-semibold text-green-900">{farmer[step.field]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

