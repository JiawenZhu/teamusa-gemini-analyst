"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { OlympicCity } from './globe/AllOlympicCityPins';

export interface GestureState {
  pinchDelta: number; // legacy, can keep or remove, let's keep for double-tap
  zoomDelta: number;  // new dynamic pinch-drag
  wristDx: number;
  wristDy: number;    // new vertical swipe
  pointerNorm: { x: number; y: number } | null;
  doubleTap: boolean;
}

export function makeGestureState(): GestureState {
  return { pinchDelta: 0, zoomDelta: 0, wristDx: 0, wristDy: 0, pointerNorm: null, doubleTap: false };
}

interface Landmark { x: number; y: number; z: number }
function dist2D(a: Landmark, b: Landmark) { return Math.hypot(a.x - b.x, a.y - b.y); }
function dist3D(a: Landmark, b: Landmark) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

// Orientation-invariant finger extension check
function isExtended(wrist: Landmark, tip: Landmark, pip: Landmark) {
  // If tip is significantly further from wrist than PIP, the finger is extended
  return dist3D(wrist, tip) > dist3D(wrist, pip) * 1.1;
}

interface Props {
  gestureRef: React.RefObject<GestureState>;
  hoveredCityRef: React.RefObject<OlympicCity | null>;
  onCitySelect: (c: OlympicCity) => void;
  active: boolean;
  hoveredCity: OlympicCity | null;
}

export default function HandGestureOverlay({ gestureRef, hoveredCityRef, onCitySelect, active, hoveredCity }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('');
  const [gesture, setGesture] = useState('');

  const prevPinch = useRef<number | null>(null);
  const prevWristX = useRef<number | null>(null);
  const prevWristY = useRef<number | null>(null);
  const pinchAnchorY = useRef<number | null>(null);
  const tapTimers = useRef<number[]>([]);
  const rafId = useRef(0);
  const landmarkerRef = useRef<unknown>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smoothedPointer = useRef<{x: number, y: number} | null>(null);

  const classify = useCallback((lm: Landmark[]) => {
    if (!gestureRef.current) return;
    const g = gestureRef.current;

    const wrist = lm[0];
    const [thumbTip, indexTip, middleTip, ringTip, pinkyTip] = [lm[4], lm[8], lm[12], lm[16], lm[20]];
    const [indexPip, middlePip, ringPip, pinkyPip] = [lm[6], lm[10], lm[14], lm[18]];

    // Check extended states using 3D distance to wrist
    const indexUp = isExtended(wrist, indexTip, indexPip);
    const middleUp = isExtended(wrist, middleTip, middlePip);
    const ringUp = isExtended(wrist, ringTip, ringPip);
    const pinkyUp = isExtended(wrist, pinkyTip, pinkyPip);

    // Palm size for scale invariance
    const middleMcp = lm[9];
    const palmSize = dist3D(wrist, middleMcp);
    
    // Pinch threshold relative to palm size
    const pinchRatio = dist3D(thumbTip, indexTip) / palmSize;

    const wristX = wrist.x;
    const wristY = wrist.y;

    // ── Wrist velocity (6-frame buffer for stability)
    if (prevWristX.current !== null) {
      const rawX = wristX - prevWristX.current;
      g.wristDx = g.wristDx * 0.6 + rawX * 0.4;
    }
    prevWristX.current = wristX;

    if (prevWristY.current !== null) {
      const rawY = wristY - prevWristY.current;
      g.wristDy = g.wristDy * 0.6 + rawY * 0.4;
    }
    prevWristY.current = wristY;

    // ── Pinch → Single Air Tap (Select City)
    if (pinchRatio < 0.35) { // 0.35 is a good scale-invariant threshold
      // We don't need a double tap anymore. A single pinch acts as a click.
      // But we use tapTimers to prevent spam-clicking every frame
      const now = Date.now();
      if (tapTimers.current.length === 0 || now - tapTimers.current[0] > 1000) {
        tapTimers.current = [now];
        g.doubleTap = true; // Still using the same property to trigger selection in FullscreenGlobe
        if (hoveredCityRef.current) onCitySelect(hoveredCityRef.current);
      }
      
      g.pointerNorm = null;
      setGesture('🤏 Air Tap (Select)');
      return;
    }
    g.pinchDelta = 0; // Legacy unused

    // ── Point (only index up) → hover cursor
    if (indexUp && !middleUp && !ringUp && !pinkyUp) {
      const rawX = indexTip.x;
      const rawY = indexTip.y;
      
      // Apply Exponential Moving Average (EMA) for smooth cursor tracking
      if (!smoothedPointer.current) {
        smoothedPointer.current = { x: rawX, y: rawY };
      } else {
        smoothedPointer.current.x = smoothedPointer.current.x * 0.7 + rawX * 0.3;
        smoothedPointer.current.y = smoothedPointer.current.y * 0.7 + rawY * 0.3;
      }
      
      g.pointerNorm = { ...smoothedPointer.current };
      setGesture('👆 Point');
      return;
    } else {
      smoothedPointer.current = null;
    }

    // ── Victory → next city
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      g.pointerNorm = null;
      setGesture('✌️ Next city');
      return;
    }

    // ── Open palm → swipe & depth zoom
    if (indexUp && middleUp && ringUp && pinkyUp) {
      g.pointerNorm = null;
      
      // Calculate palm depth zoom
      if (pinchAnchorY.current === null) { // Re-using this ref for prevPalmSize
        pinchAnchorY.current = palmSize;
        g.zoomDelta = 0;
      } else {
        const sizeDelta = palmSize - pinchAnchorY.current;
        // If palmSize increases (hand closer), sizeDelta is positive -> Zoom In
        g.zoomDelta = g.zoomDelta * 0.7 + sizeDelta * 40 * 0.3; 
        pinchAnchorY.current = palmSize;
      }
      
      setGesture('✋ 3D Control');
      return;
    }

    // Decay when no active gesture
    g.pointerNorm = null;
    g.wristDx = g.wristDx * 0.8; 
    g.wristDy = g.wristDy * 0.8; 
    g.zoomDelta = g.zoomDelta * 0.8;
    pinchAnchorY.current = null;
    setGesture('');
  }, [gestureRef, hoveredCityRef, onCitySelect]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function init() {
      try {
        setStatus('Loading MediaPipe…');
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const lm = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO', numHands: 1,
        });
        if (cancelled) { lm.close(); return; }
        landmarkerRef.current = lm;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }

        setReady(true); setStatus('Hand tracking active');
        let last = -1;
        function loop(now: number) {
          if (cancelled) return;
          rafId.current = requestAnimationFrame(loop);
          if (!videoRef.current || !landmarkerRef.current || now === last) return;
          last = now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = (landmarkerRef.current as any).detectForVideo(videoRef.current, now);
          if (res.landmarks?.length > 0) {
            classify(res.landmarks[0]);
            drawSkeleton(res.landmarks[0]);
          } else {
            if (gestureRef.current) { gestureRef.current.pointerNorm = null; gestureRef.current.wristDx = 0; }
            setGesture('');
          }
        }
        rafId.current = requestAnimationFrame(loop);
      } catch (e) { setStatus(`Error: ${e}`); }
    }
    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (landmarkerRef.current as any)?.close?.();
      landmarkerRef.current = null;
      setReady(false); setStatus(''); setGesture('');
      if (gestureRef.current) Object.assign(gestureRef.current, makeGestureState());
    };
  }, [active, classify, gestureRef]);

  function drawSkeleton(lm: Landmark[]) {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const CONN = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]];
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    for (const [a, b] of CONN) {
      ctx.beginPath();
      ctx.moveTo((1 - lm[a].x) * c.width, lm[a].y * c.height);
      ctx.lineTo((1 - lm[b].x) * c.width, lm[b].y * c.height);
      ctx.stroke();
    }
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc((1 - p.x) * c.width, p.y * c.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa'; ctx.fill();
    }
  }

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ background: ready ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${ready ? '#10b981' : '#3b82f6'}40`, borderRadius: 20, padding: '4px 12px', fontSize: 11, color: ready ? '#10b981' : '#60a5fa', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
        {status || 'Starting…'}
      </div>

      {gesture && (
        <div style={{ background: 'rgba(2,8,23,0.9)', border: '1px solid #3b82f640', borderRadius: 12, padding: '6px 14px', fontSize: 14, color: '#fff', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
          {gesture}
          {gesture === '🤏 Air Tap (Select)' && hoveredCity && (
            <span style={{ color: '#FFD700', marginLeft: 8, fontSize: 12 }}>→ {hoveredCity.city}</span>
          )}
        </div>
      )}

      <div style={{ position: 'relative', width: 160, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px solid #3b82f650', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <video ref={videoRef} width={160} height={120} muted playsInline style={{ transform: 'scaleX(-1)', display: 'block' }} />
        <canvas ref={canvasRef} width={160} height={120} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        {!ready && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,23,0.7)', color: '#60a5fa', fontSize: 10, fontWeight: 700 }}>⏳ Loading…</div>
        )}
      </div>

      <div style={{ background: 'rgba(2,8,23,0.9)', borderRadius: 10, padding: '8px 12px', fontSize: 10, color: '#94a3b8', lineHeight: 1.9, border: '1px solid #1e293b', backdropFilter: 'blur(8px)', maxWidth: 160 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4 }}>Gestures</div>
        <div>👆 Point — hover city</div>
        <div>🤏 Pinch — select city</div>
        <div>✋ Palm — move & zoom</div>
        <div>✌️ Victory — next city</div>
      </div>
    </div>
  );
}
