import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Event interface for browser speech recognition outputs.
 */
export interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

/**
 * Interface representing standard browser SpeechRecognition interface.
 */
export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Custom React hook to interface with browser speech recognition and synthesis APIs.
 */
export function useVoiceSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSpeechSupported(true);
      const rec = new SpeechRecognitionClass() as SpeechRecognition;
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = useCallback((language: string, onResult: (text: string) => void) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (recognitionRef.current) {
      const langMapping: Record<string, string> = {
        english: 'en-US',
        hindi: 'hi-IN',
        telugu: 'te-IN',
        tamil: 'ta-IN',
        kannada: 'kn-IN',
      };
      recognitionRef.current.lang = langMapping[language] || 'en-US';
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        onResult(text);
      };
      
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  }, [isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speak = useCallback((text: string, language: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMapping: Record<string, string> = {
      english: 'en-US',
      hindi: 'hi-IN',
      telugu: 'te-IN',
      tamil: 'ta-IN',
      kannada: 'kn-IN',
    };
    utterance.lang = langMapping[language] || 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    speechSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
export default useVoiceSpeech;
