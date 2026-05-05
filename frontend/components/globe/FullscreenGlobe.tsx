"use client";
/**
 * FullscreenGlobe — immersive full-screen globe overlay
 *
 * Features:
 *  • High-resolution canvas (dpr up to 3, sphere 128 segments)
 *  • All Olympic host city pins (medal-weighted)
 *  • City detail drawer (right panel)
 *  • Hand gesture support (MediaPipe pinch/point/double-tap)
 *  • Year filter slider (animate pins by era)
 *  • Escape / ✕ to close
 */
import React, {
  Suspense, useRef, useState, useEffect, useCallback, startTransition,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hand, Filter, Mic, MicOff, Volume2 } from 'lucide-react';

import EarthSphere from './EarthSphere';
import CityMarkers from './CityMarkers';
import FlightArc from './FlightArc';
import AllOlympicCityPins, { OlympicCity } from './AllOlympicCityPins';
import HandGestureOverlay, { GestureState, makeGestureState } from '../HandGestureOverlay';
// import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

const LA = { lat: 34.0522, lng: -118.2437 };
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Dark-mode inline markdown renderer ────────────────────────────────────────
// Converts **bold** → gold highlighted chip span, other text → plain span.
function renderInline(text: string, accent: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <span key={i} style={{
          fontWeight: 800, color: accent,
          background: `${accent}18`, borderRadius: 3,
          padding: '0 4px',
        }}>
          {p.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

// ── Olympic keyword highlighter for the live chat overlay ─────────────────────
const OLYMPIC_PATTERNS: { re: RegExp; color: string; bg: string; icon?: string }[] = [
  // Gold medals / 1st place
  { re: /\b(gold\s+medal[s]?|1st\s+place|first\s+place|champion(?:ship)?s?|🥇)\b/gi,
    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: '🥇' },
  // Silver medals / 2nd place
  { re: /\b(silver\s+medal[s]?|2nd\s+place|second\s+place|runner[- ]up|🥈)\b/gi,
    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: '🥈' },
  // Bronze medals / 3rd place
  { re: /\b(bronze\s+medal[s]?|3rd\s+place|third\s+place|🥉)\b/gi,
    color: '#CD7F32', bg: 'rgba(205,127,50,0.12)', icon: '🥉' },
  // Medal counts (numbers followed by "medal(s)" or "gold/silver/bronze")
  { re: /\b(\d+)\s+(gold|silver|bronze)\s+medal[s]?\b/gi,
    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: '🏅' },
  // Team USA
  { re: /\b(Team\s+USA|USA|United\s+States)\b/g,
    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', icon: undefined },
  // **bold** markdown
  { re: /\*\*([^*]+)\*\*/g,
    color: '#E2E8F0', bg: 'rgba(255,255,255,0.06)', icon: undefined },
];

function renderLiveText(text: string): React.ReactNode {
  if (!text) return null;

  // Build an array of {start, end, color, bg, icon, label} spans
  type Span = { start: number; end: number; color: string; bg: string; icon?: string; label: string };
  const spans: Span[] = [];

  for (const { re, color, bg, icon } of OLYMPIC_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // Check no overlap with existing spans
      const s = m.index, e = m.index + m[0].length;
      if (spans.some(sp => s < sp.end && e > sp.start)) continue;
      // For **bold** pattern, display the inner capture group (strip asterisks)
      const isBold = re.source.includes('\\*\\*');
      const label = isBold ? (m[1] ?? m[0]) : m[0];
      spans.push({ start: s, end: e, color, bg, icon, label });
    }
  }

  if (spans.length === 0) return <span>{text}</span>;

  spans.sort((a, b) => a.start - b.start);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.start > cursor) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor, sp.start)}</span>);
    nodes.push(
      <span key={`h${sp.start}`} style={{
        color: sp.color,
        background: sp.bg,
        borderRadius: 4,
        padding: '0 3px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {sp.icon && !sp.label.match(/^[🥇🥈🥉🏅]/) ? `${sp.icon} ` : ''}{sp.label}
      </span>
    );
    cursor = sp.end;
  }
  if (cursor < text.length) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>);
  return <>{nodes}</>;
}

// Renders the full Gemini response into structured dark-mode cards
function CityResponseBody({ text, accent }: { text: string; accent: string }) {
  const lines = text.split('\n').filter(l => l.trim());

  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletGroup.length === 0) return;
    blocks.push(
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
        {bulletGroup.map((b, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${accent}20`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 10px 10px 0',
            padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚡</span>
            <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
              {renderInline(b, accent)}
            </span>
          </div>
        ))}
      </div>
    );
    bulletGroup = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Section header: ## or bold-only line
    if (/^#{1,3}\s/.test(trimmed)) {
      flushBullets(`flush-${idx}`);
      const title = trimmed.replace(/^#{1,3}\s*/, '');
      blocks.push(
        <div key={idx} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 12, marginBottom: 4,
        }}>
          <div style={{ flex: 1, height: 1, background: `${accent}30` }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: accent,
            textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
          <div style={{ flex: 1, height: 1, background: `${accent}30` }} />
        </div>
      );
      return;
    }

    // Bullet item (-, *, •, or numbered)
    if (/^[-*•]\s|^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s|^\d+\.\s/, '');
      bulletGroup.push(content);
      return;
    }

    // Regular paragraph
    flushBullets(`flush-${idx}`);
    if (trimmed) {
      blocks.push(
        <p key={idx} style={{
          margin: '6px 0', fontSize: 13, lineHeight: 1.75, color: '#94a3b8',
        }}>
          {renderInline(trimmed, accent)}
        </p>
      );
    }
  });

  flushBullets('final');
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{blocks}</div>;
}

// ── Cache for city highlights ──
const cityHighlightsCache: Record<string, string> = {};

// ── City detail panel ─────────────────────────────────────────────────────────
function CityDetailPanel({
  city, onClose, archetypeId, setIsGenerating, onGoToChat, gestureActive
}: { city: OlympicCity; onClose: () => void; archetypeId: string, setIsGenerating: (val: boolean) => void, onGoToChat?: (city: string) => void, gestureActive?: boolean }) {
  const [chatText, setChatText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const medalColor = city.usa_medals >= 300 ? '#FFD700'
    : city.usa_medals >= 150 ? '#C0C0C0'
      : city.usa_medals >= 50 ? '#CD7F32' : '#60a5fa';

  useEffect(() => {
    const cacheKey = `${city.city}-${archetypeId}`;
    if (cityHighlightsCache[cacheKey]) {
      const cached = cityHighlightsCache[cacheKey];
      startTransition(() => {
        setChatText(cached);
        setLoading(false);
        setIsGenerating(false);
      });
      return;
    }

    startTransition(() => {
      setChatText('');
      setLoading(true);
      setIsGenerating(true);
    });

    // Cancel previous requests if user clicks too quickly
    const abortController = new AbortController();

    // Fast path: bypass agent tools and use direct endpoint
    fetch(`${API_BASE}/api/city-highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: city.city,
        season: city.season,
        years: city.years,
        usa_medals: city.usa_medals,
        archetype_id: archetypeId
      }),
      signal: abortController.signal,
    })
      .then(r => r.json())
      .then(d => {
        startTransition(() => {
          const text = d.highlights ?? 'No data available.';
          cityHighlightsCache[cacheKey] = text;
          setChatText(text);
          setLoading(false);
          setIsGenerating(false);
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // Ignore aborted requests
        setChatText('Could not load city highlights.');
        setLoading(false);
        setIsGenerating(false);
      });

    return () => abortController.abort();
  }, [city, archetypeId, setIsGenerating]);

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 350, background: 'rgba(5,12,30,0.98)',
        borderLeft: `1px solid ${medalColor}25`,
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 200, overflow: 'hidden',
      }}
    >
      {/* ── Coloured accent bar ── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${medalColor}, ${medalColor}44)` }} />

      {/* ── Header ── */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: `1px solid ${medalColor}20`,
        background: `linear-gradient(160deg, ${medalColor}12 0%, transparent 60%)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: 10, color: medalColor, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5,
            }}>
              {city.season === 'Winter' ? '❄️ Winter Olympics' : '☀️ Summer Olympics'}
            </div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {city.city}
            </h2>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
              {city.years.join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${medalColor}30`,
            borderRadius: 9, padding: '7px 11px', color: '#64748b',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            transition: 'all 0.2s',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[
            { value: city.usa_medals, label: 'USA Medals', highlight: true },
            { value: city.total_medals, label: 'All Medals', highlight: false },
            { value: city.years.length, label: 'Times Hosted', highlight: false },
          ].map(({ value, label, highlight }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center', borderRadius: 10, padding: '10px 8px',
              background: highlight ? `${medalColor}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${highlight ? medalColor + '40' : '#1e293b'}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: highlight ? medalColor : '#e2e8f0', lineHeight: 1 }}>
                {value.toLocaleString()}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {/* Section label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
        }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: medalColor }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: medalColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Team USA Highlights
          </span>
          <div style={{ flex: 1, height: 1, background: `${medalColor}20` }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[90, 85, 80].map((w, i) => (
              <div key={i} style={{
                borderRadius: 10, padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                borderLeft: '3px solid #1e293b',
              }}>
                {[100, w, 60].map((pw, j) => (
                  <div key={j} style={{
                    height: 10, borderRadius: 4, marginBottom: j < 2 ? 6 : 0,
                    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 1.4s ${i * 0.15 + j * 0.07}s infinite`,
                    width: `${pw}%`,
                  }} />
                ))}
              </div>
            ))}
            <style>{`
              @keyframes shimmer {
                0%   { background-position:  200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        ) : (
          <div 
            onClick={() => onGoToChat?.(city.city)} 
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              borderRadius: 8, 
              padding: 4, 
              margin: -4 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title={`Ask Gemini more about ${city.city}`}
          >
            <CityResponseBody text={chatText} accent={medalColor} />
            <div style={{
              fontSize: 11, color: '#3b82f6',
              fontWeight: 600, marginTop: 12,
              display: 'flex', alignItems: 'center', gap: 4,
              opacity: 0.8
            }}>
              {gestureActive ? "Air double-tap again to chat about this with Gemini →" : "Click here to chat about this with Gemini →"}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 18px', borderTop: `1px solid ${medalColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        background: `${medalColor}06`,
      }}>
        <span style={{ fontSize: 14 }}>🤏</span>
        <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>
          Air double-tap to select another city
        </span>
      </div>
    </motion.div>
  );
}

// ── GestureApplier: runs inside Canvas, reads gestureRef each frame ──────────────
function GestureApplier({
  gestureRef, groupRef, cities, hoveredCityRef, onHover, onSelect, gestureActive,
}: {
  gestureRef: React.RefObject<GestureState>;
  groupRef: React.RefObject<THREE.Group>;
  cities: OlympicCity[];
  hoveredCityRef: React.RefObject<OlympicCity | null>;
  onHover: (c: OlympicCity | null) => void;
  onSelect: (c: OlympicCity) => void;
  gestureActive: boolean;
}) {
  const rcRef = useRef(new THREE.Raycaster());
  const hitRef = useRef(new THREE.Vector3());
  const swipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSpinRef = useRef(true);
  const velocity = useRef({ x: 0, y: 0 }); // Physics-based velocity

  useFrame(({ camera: c }) => {
    if (!gestureActive) return;
    const g = gestureRef.current;
    if (!g) return;

    // 1️⃣ Pinch → zoom (both legacy pinchDelta and new zoomDelta)
    if (Math.abs(g.pinchDelta) > 0.001 || Math.abs(g.zoomDelta) > 0.001) {
      const dist = c.position.length();
      const zoomChange = Math.abs(g.zoomDelta) > 0 ? g.zoomDelta : g.pinchDelta * 0.08;
      const newDist = THREE.MathUtils.clamp(dist - zoomChange, 2.2, 12);
      c.position.setLength(newDist);
      g.pinchDelta = 0;
      g.zoomDelta = 0;
    }

    // 2️⃣ Swipe → rotate globe with physics
    if (groupRef.current) {
      if (g.pointerNorm) {
        // Stop all momentum instantly if pointing so the user can aim
        velocity.current.x = 0;
        velocity.current.y = 0;
      } else {
        // Transfer hand movement to velocity when actively swiping
        if (Math.abs(g.wristDx) > 0.003 || Math.abs(g.wristDy) > 0.003) {
          velocity.current.x = g.wristDx * 2.5;
          velocity.current.y = g.wristDy * 2.5;
          g.wristDx = 0;
          g.wristDy = 0;
          
          // Pause auto-spin (legacy ref, keeping to avoid breaking other logic)
          autoSpinRef.current = false;
          if (swipeTimer.current) clearTimeout(swipeTimer.current);
          swipeTimer.current = setTimeout(() => { autoSpinRef.current = true; }, 2000);
        }
      }
      
      // Apply velocity to rotation
      if (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001) {
        groupRef.current.rotation.y -= velocity.current.x;
        groupRef.current.rotation.x -= velocity.current.y;
        
        // Clamp X rotation to prevent the globe from flipping upside down
        groupRef.current.rotation.x = THREE.MathUtils.clamp(groupRef.current.rotation.x, -Math.PI / 3, Math.PI / 3);
        
        // Decay velocity (friction)
        velocity.current.x *= 0.92;
        velocity.current.y *= 0.92;
      }
    } else {
      g.wristDx = 0;
      g.wristDy = 0;
    }

    // 3️⃣ Point → find nearest city via raycasting
    if (g.pointerNorm && cities.length > 0 && groupRef.current) {
      // Webcam is mirrored (scaleX -1), so flip x
      const ndcX = 1 - g.pointerNorm.x * 2;
      const ndcY = -(g.pointerNorm.y * 2 - 1);
      rcRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), c);

      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2);
      const didHit = rcRef.current.ray.intersectSphere(sphere, hitRef.current);

      if (didHit) {
        const local = groupRef.current.worldToLocal(hitRef.current.clone());
        const phi = Math.acos(THREE.MathUtils.clamp(local.y / 2, -1, 1));
        const theta = Math.atan2(local.z, -local.x);
        const hitLat = 90 - phi * (180 / Math.PI);
        const hitLng = (theta * (180 / Math.PI)) - 180;

        let nearest: OlympicCity | null = null;
        let minD = Infinity;
        for (const city of cities) {
          let dLng = Math.abs(city.lng - hitLng);
          if (dLng > 180) dLng = 360 - dLng;
          const d = Math.hypot(city.lat - hitLat, dLng);
          if (d < minD) { minD = d; nearest = city; }
        }
        onHover(nearest && minD < 20 ? nearest : null);
      } else {
        onHover(null);
      }
    }

    // 4️⃣ Double-tap → select
    if (g.doubleTap) {
      g.doubleTap = false;
      if (hoveredCityRef.current) onSelect(hoveredCityRef.current);
    }
  });

  return null;
}

// ── GestureCursor: glowing dot on globe surface where finger points ───────────
function GestureCursor({
  gestureRef, gestureActive,
}: { gestureRef: React.RefObject<GestureState>; gestureActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const rcRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const hitRef = useRef<THREE.Vector3>(new THREE.Vector3());

  useFrame(({ camera: c }) => {
    if (!meshRef.current) return;
    const g = gestureRef.current;
    if (!gestureActive || !g?.pointerNorm) { meshRef.current.visible = false; return; }

    const ndcX = 1 - g.pointerNorm.x * 2;
    const ndcY = -(g.pointerNorm.y * 2 - 1);
    rcRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), c);
    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2.02);
    if (rcRef.current.ray.intersectSphere(sphere, hitRef.current)) {
      meshRef.current.visible = true;
      meshRef.current.position.copy(hitRef.current);
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} />
    </mesh>
  );
}

// ── Globe group (rotation + all markers + gesture applier) ─────────────────
interface GlobeGroupProps {
  userLocation?: { lat: number; lng: number; city?: string } | null;
  triggerCity?: { lat: number; lng: number; city?: string } | null;
  activeCity?: { lat: number; lng: number; city?: string } | null;
  filteredCities: OlympicCity[];
  allCities: OlympicCity[];
  hoveredCity: OlympicCity | null;
  onHover: (c: OlympicCity | null) => void;
  onSelect: (c: OlympicCity) => void;
  gestureRef: React.RefObject<GestureState>;
  hoveredCityRef: React.RefObject<OlympicCity | null>;
  gestureActive: boolean;
}

function GlobeGroup({
  userLocation, triggerCity, activeCity, filteredCities, allCities,
  hoveredCity, onHover, onSelect,
  gestureRef, hoveredCityRef, gestureActive,
}: GlobeGroupProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const targetRotY = useRef<number | null>(null);
  const autoSpin = useRef(true);
  const { camera } = useThree();

  useEffect(() => {
    if (!activeCity) { autoSpin.current = true; return; }
    autoSpin.current = false;
    if (groupRef.current) {
      // Calculate target rotation relative to current camera angle
      const cameraAzimuth = Math.atan2(camera.position.x, camera.position.z);
      // For this mapping (where lng=0 is +x natively), the azimuth is (lng + 90)
      const cityAzimuth = (activeCity.lng + 90) * Math.PI / 180;
      
      const raw = cameraAzimuth - cityAzimuth;
      const cur = groupRef.current.rotation.y;
      const diff = ((raw - cur) % (2 * Math.PI));
      targetRotY.current = cur + (diff > Math.PI ? diff - 2 * Math.PI : diff < -Math.PI ? diff + 2 * Math.PI : diff);
    }
    const t = setTimeout(() => { autoSpin.current = true; targetRotY.current = null; }, 8000);
    return () => clearTimeout(t);
  }, [activeCity, camera]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (targetRotY.current !== null) {
      const dist = targetRotY.current - groupRef.current.rotation.y;
      if (Math.abs(dist) < 0.002) { groupRef.current.rotation.y = targetRotY.current; targetRotY.current = null; }
      else groupRef.current.rotation.y += dist * Math.min(delta * 3, 0.12);
    } else if (autoSpin.current && !gestureActive && !hoveredCityRef.current) {
      groupRef.current.rotation.y += delta * 0.035;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <EarthSphere />
        <CityMarkers userLocation={userLocation} triggerCity={triggerCity} />
        <AllOlympicCityPins
          cities={filteredCities}
          hoveredCity={hoveredCity}
          onHover={onHover}
          onSelect={onSelect}
        />
        {userLocation && (
          <FlightArc
            fromLat={userLocation.lat} fromLng={userLocation.lng}
            toLat={LA.lat} toLng={LA.lng}
            color="#FFD700"
          />
        )}
        {/* Gesture applier — reads gestureRef every frame, applies to camera + group */}
        <GestureApplier
          gestureRef={gestureRef}
          groupRef={groupRef}
          cities={allCities}
          hoveredCityRef={hoveredCityRef}
          onHover={onHover}
          onSelect={onSelect}
          gestureActive={gestureActive}
        />
      </group>
      {/* Visual cursor dot on globe surface (outside group so it isn't affected by globe rotation) */}
      <GestureCursor gestureRef={gestureRef} gestureActive={gestureActive} />
    </>
  );
}

// ── Main fullscreen component ─────────────────────────────────────────────────
interface FullscreenGlobeProps {
  userLocation: { lat: number; lng: number; city: string } | null;
  triggerCity: { city: string; lat: number; lng: number } | null;
  archetypeId: string;
  onClose: () => void;
  onGoToChat?: (city: string) => void;
  pauseGesture?: boolean;
  voiceAssistant?: {
    voiceEnabled: boolean;
    micState: string;
    toggleLive: (prompt?: string) => void;
  };
}

export default function FullscreenGlobe({
  userLocation, triggerCity, archetypeId, onClose, onGoToChat, pauseGesture, voiceAssistant
}: FullscreenGlobeProps) {
  const [allCities, setAllCities] = useState<OlympicCity[]>([]);
  const [hoveredCity, setHoveredCity] = useState<OlympicCity | null>(null);
  const [selectedCity, setSelectedCity] = useState<OlympicCity | null>(null);
  const [gestureActive, setGestureActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([1896, 2016]);
  const [showFilter, setShowFilter] = useState(false);
  const [liveMessages, setLiveMessages] = useState<{role: 'agent' | 'user'; text: string}[]>([]);

  const voiceEnabled = voiceAssistant?.voiceEnabled ?? false;
  const micState = voiceAssistant?.micState ?? 'idle';
  const toggleLive = voiceAssistant?.toggleLive ?? (() => {});

  // Listen for live text from voice
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onText = (e: Event) => {
      const { role, text } = (e as CustomEvent<{role: 'agent' | 'user'; text: string}>).detail;
      if (!text?.trim()) return;
      setLiveMessages(prev => {
        // If same role as last message, append to it (streaming chunks)
        const last = prev[prev.length - 1];
        if (last && last.role === role) {
          return [...prev.slice(0, -1), { role, text: last.text + text }];
        }
        return [...prev, { role, text }];
      });
    };
    window.addEventListener('live_text', onText);
    return () => window.removeEventListener('live_text', onText);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [liveMessages]);

  // Clear chat history when a new voice session starts
  useEffect(() => {
    if (voiceEnabled) {
      setLiveMessages([]);
    }
  }, [voiceEnabled]);

  // Shared refs — written by HandGestureOverlay, read by GestureApplier every frame
  const gestureRef = useRef<GestureState>(makeGestureState());
  const hoveredCityRef = useRef<OlympicCity | null>(null);

  // Keep hoveredCityRef in sync with React state (for double-tap reads)
  useEffect(() => { hoveredCityRef.current = hoveredCity; }, [hoveredCity]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fetch all Olympic cities
  useEffect(() => {
    fetch(`${API_BASE}/api/olympic-cities`)
      .then(r => r.json())
      .then(d => startTransition(() => setAllCities(d.cities ?? [])))
      .catch(() => { });
  }, []);

  const handleGestureSelect = useCallback((city: OlympicCity) => {
    if (isGenerating) return;
    if (selectedCity && selectedCity.city === city.city) {
      if (onGoToChat) onGoToChat(city.city);
    } else {
      startTransition(() => setSelectedCity(city));
    }
  }, [isGenerating, selectedCity, onGoToChat]);

  // Filter cities by year range
  const filteredCities = allCities.filter(c =>
    c.years.some(y => y >= yearRange[0] && y <= yearRange[1])
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: '#010818',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(1,8,24,0.95) 0%, transparent 100%)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            🌍 Olympic World Map
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            {filteredCities.length} host cities · click pin for details · Esc to exit
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Year filter toggle */}
          <button
            onClick={() => setShowFilter(v => !v)}
            style={{
              background: showFilter ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFilter ? '#3b82f6' : '#1e293b'}`,
              borderRadius: 10, padding: '8px 14px',
              color: showFilter ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <Filter size={14} />
            {yearRange[0]}–{yearRange[1]}
          </button>

          {/* Hand gesture toggle */}
          <button
            onClick={() => setGestureActive(v => !v)}
            title="Toggle hand gesture control"
            style={{
              background: gestureActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${gestureActive ? '#10b981' : '#1e293b'}`,
              borderRadius: 10, padding: '8px 14px',
              color: gestureActive ? '#10b981' : '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <Hand size={14} />
            {gestureActive ? 'Gesture ON' : 'Gesture'}
          </button>

          {/* Voice AI toggle */}
          <button
            onClick={() => toggleLive('You are helping a user explore the Olympic World Map. Introduce yourself briefly and let them know they can ask you anything about the Olympics.')} 
            title={voiceEnabled ? 'Stop Voice AI' : 'Talk to the AI Analyst'}
            style={{
              background: voiceEnabled ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)',
              border: `1px solid ${voiceEnabled ? '#ef4444' : '#6366f1'}`,
              borderRadius: 10, padding: '8px 14px',
              color: voiceEnabled ? '#f87171' : '#a5b4fc',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
              position: 'relative',
            }}
          >
            {voiceEnabled
              ? (micState === 'speaking' ? <Volume2 size={14} style={{ animation: 'pulse 1s infinite' }} /> : <MicOff size={14} />)
              : <Mic size={14} />}
            {voiceEnabled
              ? (micState === 'speaking' ? 'Speaking…' : micState === 'listening' ? 'Listening…' : 'Voice ON')
              : 'Voice AI'}
            {voiceEnabled && micState === 'listening' && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 6, height: 6, borderRadius: '50%',
                background: '#f87171',
                animation: 'pulse-dot 1.2s ease-in-out infinite',
              }} />
            )}
          </button>

          {/* Close */}
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b',
            borderRadius: 10, padding: '8px 14px',
            color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* Year filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            style={{
              position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
              zIndex: 110, background: 'rgba(2,8,23,0.95)',
              border: '1px solid #1e293b', borderRadius: 14, padding: '16px 24px',
              backdropFilter: 'blur(16px)', minWidth: 340,
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 700 }}>
              Filter by year: {yearRange[0]} – {yearRange[1]}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>1896</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="range" min={1896} max={2016} step={4}
                  value={yearRange[0]}
                  onChange={e => setYearRange([+e.target.value, yearRange[1]])}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <input type="range" min={1896} max={2016} step={4}
                  value={yearRange[1]}
                  onChange={e => setYearRange([yearRange[0], +e.target.value])}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>2016</span>
            </div>
            {/* Era presets */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'All', range: [1896, 2016] as [number, number] },
                { label: 'Modern (1992+)', range: [1992, 2016] as [number, number] },
                { label: 'Cold War', range: [1952, 1988] as [number, number] },
                { label: 'Golden Era', range: [1896, 1936] as [number, number] },
              ].map(({ label, range }) => (
                <button key={label} onClick={() => setYearRange(range)} style={{
                  background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f640',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 11, color: '#60a5fa', cursor: 'pointer',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 3]}
        gl={{ antialias: true, alpha: false }}
        style={{ flex: 1, background: '#010818' }}
      >
        <Stars radius={150} depth={80} count={12000} factor={5} saturation={0.3} fade speed={0.4} />
        <Suspense fallback={null}>
          <GlobeGroup
            userLocation={userLocation}
            triggerCity={triggerCity}
            activeCity={selectedCity || triggerCity}
            allCities={allCities}
            filteredCities={filteredCities}
            hoveredCity={hoveredCity}
            onHover={setHoveredCity}
            onSelect={handleGestureSelect}
            gestureRef={gestureRef}
            hoveredCityRef={hoveredCityRef}
            gestureActive={gestureActive}
          />
        </Suspense>
        <OrbitControls
          enableZoom={!gestureActive} enablePan={false} enableRotate={!gestureActive}
          rotateSpeed={0.4} zoomSpeed={0.8}
          minDistance={2.2} maxDistance={12}
          enableDamping dampingFactor={0.07}
        />
      </Canvas>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24,
        background: 'rgba(2,8,23,0.85)', borderRadius: 12,
        padding: '12px 16px', border: '1px solid #1e293b',
        backdropFilter: 'blur(12px)', fontSize: 11,
      }}>
        <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>USA Medal Tiers</div>
        {[
          { color: '#FFD700', label: '🥇 Gold — 300+ medals' },
          { color: '#C0C0C0', label: '🥈 Silver — 150–300' },
          { color: '#CD7F32', label: '🥉 Bronze — 50–150' },
          { color: '#60a5fa', label: '❄️ Winter / small games' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ color: '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Voice AI status panel & Chat Log */}
      <AnimatePresence>
        {voiceEnabled && (
          <motion.div
            key="voice-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'absolute',
              top: 100,
              bottom: 40,
              right: 40,
              width: 380,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 150,
            }}
          >
            {/* Header: Controls & Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
              background: 'rgba(2,8,23,0.4)', backdropFilter: 'blur(12px)',
              padding: '12px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: micState === 'speaking' ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.2)',
                  border: `2px solid ${micState === 'speaking' ? '#6366f1' : '#ef4444'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: micState === 'listening' ? 'ring-pulse 1.5s ease-in-out infinite' : 'none',
                }}>
                  {micState === 'speaking' ? <Volume2 size={16} color="#a5b4fc" /> : <Mic size={16} color="#f87171" />}
                </div>
                {micState === 'listening' && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    border: '2px solid rgba(239,68,68,0.4)',
                    animation: 'ring-expand 1.5s ease-out infinite',
                  }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                  {micState === 'speaking' ? 'AI Analyst speaking…' :
                   micState === 'listening' ? 'Listening…' : 'Connecting…'}
                </div>
              </div>
              <button
                onClick={() => toggleLive()}
                style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: 8, padding: '6px 12px', color: '#f87171',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >
                End
              </button>
            </div>

              {/* Scrolling Chat Log (Apple Music style) */}
            <div
              ref={chatScrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 4px 8px 0',
                // Tighter gradient: transparent at top, fully opaque from 25% down
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 10%, black 28%, black 100%)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 10%, black 28%, black 100%)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, paddingTop: 60 }}>
                {liveMessages.length === 0 ? (
                  <span style={{
                    opacity: 0.3, fontWeight: 400, fontSize: 14,
                    fontStyle: 'italic', color: '#94a3b8', lineHeight: 1.6,
                  }}>Try asking: "Which city has hosted the most Olympics?"</span>
                ) : (
                  liveMessages.map((msg, i) => {
                    const total = liveMessages.length;
                    const fromEnd = total - 1 - i; // 0 = most recent
                    const opacity = Math.max(0.15, 1 - fromEnd * 0.18);
                    const isLatest = i === total - 1;
                    const prevMsg = i > 0 ? liveMessages[i - 1] : null;
                    const showDivider = prevMsg && prevMsg.role !== msg.role && msg.role === 'agent';

                    return (
                      <div key={i}>
                        {/* Turn separator: thin rule before each new agent response */}
                        {showDivider && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            margin: '6px 0 10px',
                            opacity: opacity * 0.5,
                          }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)' }} />
                            <span style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(96,165,250,0.4)', textTransform: 'uppercase' }}>response</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)' }} />
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          opacity,
                          transition: 'opacity 0.4s ease',
                        }}>
                          {/* Role label — only on first of consecutive same-role messages */}
                          {(i === 0 || liveMessages[i - 1].role !== msg.role) && (
                            <span style={{
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: msg.role === 'user' ? 'rgba(148,163,184,0.5)' : 'rgba(96,165,250,0.55)',
                              marginBottom: 1,
                              paddingLeft: msg.role === 'agent' ? 2 : 0,
                              paddingRight: msg.role === 'user' ? 2 : 0,
                            }}>
                              {msg.role === 'user' ? '🎙 You' : '⚡ AI Analyst'}
                            </span>
                          )}
                          <div style={{
                            fontSize: msg.role === 'agent' ? (isLatest ? 17 : 15) : 13,
                            fontWeight: msg.role === 'agent' ? (isLatest ? 500 : 400) : 400,
                            color: msg.role === 'agent' ? (isLatest ? '#f1f5f9' : '#cbd5e1') : '#94a3b8',
                            lineHeight: 1.7,
                            letterSpacing: msg.role === 'agent' ? '-0.01em' : 'normal',
                            maxWidth: '100%',
                          }}>
                            {msg.role === 'agent'
                              ? renderLiveText(msg.text)
                              : <span style={{ fontStyle: 'italic' }}>{msg.text}</span>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS keyframes for voice animations */}
      <style>{`
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes ring-expand {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* City detail panel */}
      <AnimatePresence>
        {selectedCity && (
          <CityDetailPanel
            key={selectedCity.city}
            city={selectedCity}
            archetypeId={archetypeId}
            onClose={() => setSelectedCity(null)}
            setIsGenerating={setIsGenerating}
            onGoToChat={onGoToChat}
            gestureActive={gestureActive}
          />
        )}
      </AnimatePresence>

      {/* Hand gesture overlay */}
      <HandGestureOverlay
        gestureRef={gestureRef}
        hoveredCityRef={hoveredCityRef}
        onCitySelect={handleGestureSelect}
        active={gestureActive && !pauseGesture}
        hoveredCity={hoveredCity}
        onCloseSideBar={() => {
          if (!isGenerating && selectedCity) {
            startTransition(() => setSelectedCity(null));
          }
        }}
      />
    </motion.div>
  );
}
