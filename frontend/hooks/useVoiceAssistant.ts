"use client";
import { useState, useCallback, useRef } from "react";

export function useVoiceAssistant() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micState, setMicState] = useState<"idle" | "listening" | "processing">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Native Browser TTS setup ──────────────────────────────────────────────
  const [nativeVoice, setNativeVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Load premium voices when available
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    
    // Priority 1: High quality human-like voices
    let selected = 
      voices.find(v => v.name.includes("Natural") && v.lang.startsWith("en-")) ||
      voices.find(v => v.name.includes("Neural") && v.lang.startsWith("en-")) ||
      voices.find(v => v.name.includes("Premium") && v.lang.startsWith("en-")) ||
      voices.find(v => v.name.includes("Google US English")) || 
      voices.find(v => v.name.includes("Samantha"));
    
    // Priority 2: Standard English voices
    if (!selected) {
      selected = voices.find(v => v.lang === "en-US") || voices.find(v => v.lang.startsWith("en-"));
    }
    
    // Fallback: First available
    setNativeVoice(selected || voices[0]);
  }, []);

  // Set up voice loading (browsers load voices asynchronously)
  if (typeof window !== 'undefined' && window.speechSynthesis && !nativeVoice) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  // Helper to play TTS via browser native API
  const playNativeTTS = useCallback((text: string) => {
    if (!voiceEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel any currently playing speech to ensure immediate response
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#]/g, '').replace(/[\n\r]+/g, '. ');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (nativeVoice) utterance.voice = nativeVoice;
    utterance.rate = 1.05; // Slightly faster for conversational feel
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn("TTS Error:", e);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, nativeVoice]);

  // Provide fallback implementation for API signature compatibility
  const playTTS = useCallback(async (text: string) => {
    playNativeTTS(text);
  }, [playNativeTTS]);

  const enqueueWavChunk = useCallback(async (audioBase64: string) => {
    // Currently disabled in favor of native TTS
    console.log("enqueueWavChunk bypassed for native TTS");
  }, []);
  
  const enqueueChunkTTS = useCallback(async (text: string) => {
    // Currently disabled in favor of native TTS
    console.log("enqueueChunkTTS bypassed for native TTS");
  }, []);

  const stopAudio = useCallback(() => {
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ── Speech Recognition ──────────────────────────────────────────────
  const startListening = useCallback((onResult: (text: string) => void, onSend: () => void) => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    stopAudio();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setMicState("listening");

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript || interimTranscript) {
        onResult(finalTranscript || interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setMicState("idle");
    };

    recognition.onend = () => {
      setMicState("processing");
      setTimeout(() => {
        onSend();
      }, 500); // give a brief delay before auto-sending
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Recognition start error:", err);
      setMicState("idle");
    }
  }, [stopAudio]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setMicState("idle");
    }
  }, []);

  return {
    voiceEnabled,
    setVoiceEnabled,
    micState,
    setMicState,
    isSpeaking,
    setIsSpeaking,
    playNativeTTS,
    playTTS,
    enqueueWavChunk,
    enqueueChunkTTS,
    stopAudio,
    startListening,
    stopListening
  };
}
