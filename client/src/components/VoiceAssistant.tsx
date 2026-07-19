import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, MessageSquare, Square } from 'lucide-react';
import { apiService } from '../services/api';
import { useVoiceSpeech } from '../hooks/useVoiceSpeech';
import { sanitizeInput } from '../utils/security';

interface VoiceAssistantProps {
  currentLanguage: string;
  userRole: string;
  onResponseReceived?: (response: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = React.memo(({
  currentLanguage,
  userRole,
  onResponseReceived
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [muteTextToSpeech, setMuteTextToSpeech] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [textQuery, setTextQuery] = useState('');

  const {
    isListening,
    isSpeaking,
    speechSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useVoiceSpeech();

  const handleSpeechResult = useCallback(async (text: string) => {
    const sanitizedText = sanitizeInput(text);
    setDisplayTranscript(`Asked: "${sanitizedText}"`);
    setAiResponse('Thinking...');

    try {
      const res = await apiService.chat(sanitizedText, currentLanguage, userRole);
      setAiResponse(res.response);
      
      if (onResponseReceived) {
        onResponseReceived(res.response);
      }
      
      if (!muteTextToSpeech) {
        speak(res.response, currentLanguage);
      }
    } catch {
      setAiResponse('Could not connect to ArenaMind services.');
    }
  }, [currentLanguage, userRole, onResponseReceived, muteTextToSpeech, speak]);

  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;

    const query = textQuery.trim();
    setTextQuery('');
    
    setDisplayTranscript(`Asked: "${query}"`);
    setAiResponse('Thinking...');

    try {
      const res = await apiService.chat(query, currentLanguage, userRole);
      setAiResponse(res.response);
      
      if (onResponseReceived) {
        onResponseReceived(res.response);
      }
      
      if (!muteTextToSpeech) {
        speak(res.response, currentLanguage);
      }
    } catch {
      setAiResponse('Could not connect to ArenaMind services.');
    }
  }, [textQuery, currentLanguage, userRole, onResponseReceived, muteTextToSpeech, speak]);

  const handleStartListening = useCallback(() => {
    setDisplayTranscript('Listening...');
    startListening(currentLanguage, handleSpeechResult);
  }, [currentLanguage, startListening, handleSpeechResult]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  const handleToggleMute = useCallback(() => {
    setMuteTextToSpeech((prev) => {
      const next = !prev;
      if (next) {
        stopSpeaking();
      }
      return next;
    });
  }, [stopSpeaking]);

  const handleClose = useCallback(() => {
    stopSpeaking();
    stopListening();
    setIsOpen(false);
  }, [stopSpeaking, stopListening]);

  if (!speechSupported) {
    return null; // Speech not supported in browser, hide floating assistant
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[2000] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-neon animate-pulse-slow transition-all duration-300 hover:scale-105 outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Open Voice AI Assistant"
        id="btn-voice-assistant-trigger"
      >
        <Mic size={24} aria-hidden="true" />
      </button>

      {/* Voice Assistant Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-assistant-title"
        >
          <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-glass border border-white/10 flex flex-col text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" aria-hidden="true"></div>
                <span id="voice-assistant-title" className="font-bold text-indigo-400">ArenaMind Voice AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleMute}
                  className="p-1 rounded text-white/60 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
                  title={muteTextToSpeech ? "Unmute Text-to-Speech" : "Mute Text-to-Speech"}
                  aria-label={muteTextToSpeech ? "Unmute vocal responses" : "Mute vocal responses"}
                >
                  {muteTextToSpeech ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 rounded text-white/60 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close Voice Assistant Panel"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* AI Assistant State Indicator / Waveform */}
            <div className="flex flex-col items-center justify-center py-6 min-h-[160px]">
              {isListening && (
                <div className="flex items-center justify-center space-x-1 mb-4 h-12" aria-hidden="true">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded animate-bounce-slow"></span>
                  <span className="w-1.5 h-12 bg-indigo-400 rounded animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-8 bg-indigo-500 rounded animate-bounce-slow [animation-delay:0.4s]"></span>
                  <span className="w-1.5 h-14 bg-indigo-400 rounded animate-bounce [animation-delay:0.1s]"></span>
                  <span className="w-1.5 h-6 bg-indigo-500 rounded animate-bounce-slow"></span>
                </div>
              )}

              {isSpeaking && (
                <div className="flex items-center justify-center space-x-1 mb-4 h-12" aria-hidden="true">
                  <span className="w-1 h-3 bg-emerald-500 rounded animate-pulse"></span>
                  <span className="w-1 h-8 bg-emerald-400 rounded animate-pulse [animation-delay:0.1s]"></span>
                  <span className="w-1 h-10 bg-emerald-500 rounded animate-pulse [animation-delay:0.3s]"></span>
                  <span className="w-1 h-6 bg-emerald-400 rounded animate-pulse [animation-delay:0.2s]"></span>
                  <span className="w-1 h-3 bg-emerald-500 rounded animate-pulse"></span>
                </div>
              )}

              {!isListening && !isSpeaking && (
                <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4" aria-hidden="true">
                  <MessageSquare className="text-white/40" size={24} />
                </div>
              )}

              <p className="text-sm text-white/80 font-medium text-center max-w-xs break-words" aria-live="polite">
                {displayTranscript || `Press microphone to speak in ${currentLanguage}`}
              </p>
            </div>

            {/* Response Section */}
            {aiResponse && (
              <div 
                className="bg-white/5 border border-white/5 rounded-xl p-4 mb-5 max-h-[140px] overflow-y-auto"
                role="region"
                aria-label="AI Text Answer"
              >
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">ArenaMind Response</span>
                <p className="text-xs text-white/90 leading-relaxed font-sans" aria-live="assertive">{aiResponse}</p>
              </div>
            )}

            {/* Keyboard text input fallback */}
            <form onSubmit={handleTextSubmit} className="mb-4 flex items-center space-x-2 border-t border-white/10 pt-4">
              <input
                type="text"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 glass-input rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-white/30 font-sans"
                aria-label="Type question for AI Assistant"
                id="txt-voice-fallback-input"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-neon outline-none focus:ring-2 focus:ring-indigo-500"
                id="btn-voice-fallback-submit"
              >
                Send
              </button>
            </form>

            {/* Footer Buttons */}
            <div className="flex items-center justify-center space-x-4">
              {isListening ? (
                <button
                  onClick={stopListening}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-neon-rose transition-all outline-none focus:ring-2 focus:ring-rose-500"
                  aria-label="Stop recording voice query"
                >
                  <MicOff size={16} aria-hidden="true" />
                  <span className="text-xs">Stop Listening</span>
                </button>
              ) : (
                <button
                  onClick={handleStartListening}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-neon hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  id="btn-voice-speak"
                  aria-label="Start recording voice query"
                >
                  <Mic size={18} aria-hidden="true" />
                  <span className="text-xs">Speak Now</span>
                </button>
              )}

              {isSpeaking && (
                <button
                  onClick={handleStopSpeaking}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-rose-400 border border-white/10 transition-all outline-none focus:ring-2 focus:ring-rose-500"
                  title="Stop speaking responses"
                  aria-label="Stop speech output"
                >
                  <Square size={14} fill="currentColor" aria-hidden="true" />
                </button>
              )}
            </div>

            <span className="text-[10px] text-center text-white/40 mt-4 block" aria-hidden="true">Powered by Google Gemini Language Models</span>
          </div>
        </div>
      )}
    </>
  );
});

VoiceAssistant.displayName = 'VoiceAssistant';
export default VoiceAssistant;
