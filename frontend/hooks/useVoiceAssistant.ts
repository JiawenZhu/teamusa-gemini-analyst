"use client";
import { useState, useCallback, useRef } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

// Gemini Live API outputs 24kHz signed 16-bit little-endian PCM
const OUTPUT_SAMPLE_RATE = 24000;
const MODEL = "gemini-3.1-flash-live-preview";

export type MicState = "idle" | "listening" | "processing" | "speaking";

// ── Downsample float32 PCM to 16kHz Int16 ─────────────────────────────────────
function downsampleTo16k(float32: Float32Array, fromRate: number): Int16Array {
  if (fromRate === 16000) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++)
      out[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
    return out;
  }
  const ratio = fromRate / 16000;
  const outLen = Math.floor(float32.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = Math.min(Math.floor(i * ratio), float32.length - 1);
    out[i] = Math.max(-32768, Math.min(32767, Math.round(float32[src] * 32767)));
  }
  return out;
}

export function useVoiceAssistant() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micState, setMicState] = useState<MicState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Session ref — the live session object from @google/genai
  const sessionRef = useRef<any>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isConnectingRef = useRef(false);
  const abortRef = useRef(false);
  const sessionIdRef = useRef(0); // Increments each connection; used to detect stale onclose events

  // ── Play a raw PCM chunk (24kHz, 16-bit LE) via Web Audio ─────────────────
  const playPCMChunk = useCallback((data: string | Uint8Array) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;

    let bytes: Uint8Array;
    if (typeof data === "string") {
      const raw = atob(data);
      bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    } else {
      bytes = data;
    }

    const samples = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) float32[i] = samples[i] / 32768;

    const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    setIsSpeaking(true);
    source.onended = () => {
      if (nextPlayTimeRef.current <= ctx.currentTime + 0.05) setIsSpeaking(false);
    };
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    console.log("🧹 Voice Assistant cleanup triggered");
    abortRef.current = true;

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { }
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (captureCtxRef.current) {
      try { captureCtxRef.current.close(); } catch { }
      captureCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      try { playbackCtxRef.current.close(); } catch { }
      playbackCtxRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close?.(); } catch { }
      sessionRef.current = null;
    }
    nextPlayTimeRef.current = 0;
  }, []);

  const disconnectLive = useCallback(() => {
    console.log("🔌 Manual disconnect triggered");
    cleanup();
    setMicState("idle");
    setIsSpeaking(false);
    setVoiceEnabled(false);
    isConnectingRef.current = false;
  }, [cleanup]);

  // ── Main connect function ──────────────────────────────────────────────────
  const connectLive = useCallback(async (
    _initialContext?: string,
    archetypeId?: string
  ) => {
    if (isConnectingRef.current || sessionRef.current) return;
    isConnectingRef.current = true;
    abortRef.current = false;
    const mySessionId = ++sessionIdRef.current; // Stamp this connection

    try {
      // 1. Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      console.log(`🎤 Microphone: ${audioTrack?.label}`);

      // 2. Capture AudioContext at browser native rate
      // @ts-expect-error webkit fallback
      const ACls = window.AudioContext || window.webkitAudioContext;
      const captureCtx = new ACls();
      captureCtxRef.current = captureCtx;
      if (captureCtx.state === "suspended") await captureCtx.resume();
      const nativeRate = captureCtx.sampleRate;
      console.log(`🎙️ Capture rate: ${nativeRate}Hz`);

      // 3. Playback context at 24kHz for Gemini output
      const playbackCtx = new ACls({ sampleRate: OUTPUT_SAMPLE_RATE });
      playbackCtxRef.current = playbackCtx;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      if (playbackCtx.state === "suspended") await playbackCtx.resume();

      // 4. Connect to backend websocket
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const wsProtocol = API_BASE.startsWith('https') ? 'wss:' : 'ws:';
      const wsHost = API_BASE.replace(/^https?:\/\//, '');
      const wsUrl = new URL(`${wsProtocol}//${wsHost}/api/voice-chat-live`);
      if (archetypeId) wsUrl.searchParams.set("archetype_id", archetypeId);

      console.log("🔗 Connecting to backend WebSocket at:", wsUrl.toString());
      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("✅ WebSocket to backend live session connected!");
        setMicState("listening");
        setVoiceEnabled(true);
        isConnectingRef.current = false;
      };

      ws.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(e.data);
          playPCMChunk(bytes);
        } else if (typeof e.data === "string") {
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === "live_text") {
              console.log("🤖 Gemini:", payload.text);
              window.dispatchEvent(new CustomEvent("live_text", { detail: { role: "agent", text: payload.text } }));
            } else if (payload.type === "user_text") {
              console.log("🎙️ User:", payload.text);
              window.dispatchEvent(new CustomEvent("live_text", { detail: { role: "user", text: payload.text } }));
            } else if (payload.type === "map_trigger") {
              window.dispatchEvent(new CustomEvent("map_trigger", { detail: payload }));
            } else if (payload.type === "status") {
              console.log("Live status:", payload.message);
            }
          } catch (err) { }
        }
      };

      ws.onerror = (e) => {
        console.error("❌ Backend WebSocket error:", e);
      };

      ws.onclose = (e) => {
        console.log("🔌 Backend WebSocket closed:", e.code, e.reason);
        // Guard: ignore close events from stale (previous) sessions
        if (sessionIdRef.current !== mySessionId) return;
        if (!abortRef.current) {
          cleanup();
          setMicState("idle");
          setIsSpeaking(false);
          setVoiceEnabled(false);
        }
      };

      // Expose minimal session interface for cleanup
      sessionRef.current = {
        close: () => ws.close()
      };

      // 5. Mic capture with VAD gating
      const micSource = captureCtx.createMediaStreamSource(stream);
      const gainNode = captureCtx.createGain();
      gainNode.gain.value = 1.5;
      micSource.connect(gainNode);

      // Use AudioWorkletNode instead of deprecated ScriptProcessorNode
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = new Float32Array(2048);
            this.offset = 0;
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0]) {
              const float32 = input[0];
              for (let i = 0; i < float32.length; i++) {
                this.buffer[this.offset++] = float32[i];
                if (this.offset >= 2048) {
                  this.port.postMessage(this.buffer);
                  this.buffer = new Float32Array(2048);
                  this.offset = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor("pcm-processor", PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await captureCtx.audioWorklet.addModule(workletUrl);

      const workletNode = new AudioWorkletNode(captureCtx, "pcm-processor");
      // @ts-ignore
      processorRef.current = workletNode;

      let lastLogTime = 0;
      let isSpeechActive = false;
      let silenceTailFrames = 0;
      const SPEECH_THRESHOLD = 0.015;
      const SILENCE_TAIL = 12;

      workletNode.port.onmessage = (e) => {
        if (!sessionRef.current || ws.readyState !== WebSocket.OPEN) return;

        const floatData = e.data as Float32Array;

        // RMS amplitude
        let sumSq = 0;
        for (let i = 0; i < floatData.length; i++) sumSq += floatData[i] * floatData[i];
        const rms = Math.sqrt(sumSq / floatData.length);

        const now = Date.now();
        if (now - lastLogTime > 2000) {
          const label = rms > SPEECH_THRESHOLD ? "🗣️ SPEECH" : "🔇 silence";
          console.log(`${label} RMS: ${(rms * 100).toFixed(1)}%`);
          lastLogTime = now;
        }

        const hasSpeech = rms > SPEECH_THRESHOLD;
        if (hasSpeech) {
          isSpeechActive = true;
          silenceTailFrames = SILENCE_TAIL;
        } else if (isSpeechActive && silenceTailFrames > 0) {
          silenceTailFrames--;
        } else {
          isSpeechActive = false;
          // Inject a micro-noise floor into perfect silence to prevent backend VAD from hanging
          for (let i = 0; i < floatData.length; i++) {
            if (floatData[i] === 0) floatData[i] = (Math.random() - 0.5) * 0.0001;
          }
        }

        // Downsample and send binary PCM to backend WebSocket
        const pcm16 = downsampleTo16k(floatData, nativeRate);
        ws.send(pcm16.buffer);
      };

      gainNode.connect(workletNode);
      const silentGain = captureCtx.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(captureCtx.destination);

      console.log(`✅ Mic streaming at ${nativeRate}Hz → 16kHz to backend WebSocket`);

    } catch (e) {
      console.error("❌ Live API setup failed:", e);
      cleanup();
      setMicState("idle");
      setVoiceEnabled(false);
      isConnectingRef.current = false;
    }
  }, [cleanup, playPCMChunk]);

  const toggleLive = useCallback((initialContext?: string, archetypeId?: string) => {
    if (sessionRef.current || isConnectingRef.current) {
      disconnectLive();
    } else {
      connectLive(initialContext, archetypeId).catch(console.error);
    }
  }, [connectLive, disconnectLive]);

  const startListening = useCallback((ctx?: string, archetypeId?: string) => {
    connectLive(ctx, archetypeId).catch(console.error);
  }, [connectLive]);

  const stopListening = useCallback(() => disconnectLive(), [disconnectLive]);
  const playNativeTTS = useCallback(async (_text: string) => { }, []);
  const stopAudio = useCallback(() => disconnectLive(), [disconnectLive]);

  return {
    voiceEnabled,
    setVoiceEnabled,
    micState,
    setMicState,
    isSpeaking,
    setIsSpeaking,
    playNativeTTS,
    stopAudio,
    startListening,
    stopListening,
    toggleLive,
    connectLive,
    disconnectLive,
  };
}
