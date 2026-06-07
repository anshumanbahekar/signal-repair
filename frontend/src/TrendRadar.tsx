import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = 'https://signal-repair-production.up.railway.app';
type Theme = 'dark' | 'light';

interface TopicResult {
  topic: string;
  category: string;
  verdict: string;
  signal_score: number;
  summary: string;
  source_count: number;
  contradiction_count: number;
  consensus_confidence: string;
  analyzed_at: string;
  status: string;
}

interface RadarResult {
  topics: TopicResult[];
  total: number;
  avg_signal_score: number;
  verdict_counts: Record<string, number>;
  most_disputed_count: number;
  generated_at: string;
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#16a34a', MOSTLY_TRUE: '#65a30d', DISPUTED: '#d97706',
  OUTDATED: '#ea580c', FALSE: '#dc2626', NOISE: '#6b7280',
};

const VERDICT_BG: Record<string, string> = {
  TRUE: '#dcfce7', MOSTLY_TRUE: '#ecfccb', DISPUTED: '#fef3c7',
  OUTDATED: '#ffedd5', FALSE: '#fee2e2', NOISE: '#f3f4f6',
};

const CATEGORY_COLORS: Record<string, string> = {
  Technology: '#3b82f6', Science: '#10b981', Health: '#ec4899',
  Business: '#8b5cf6', Finance: '#f59e0b', Politics: '#ef4444',
  Economics: '#06b6d4',
};

function RadarSweep({ theme }: { theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) / 2 - 10;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background circles
      for (let r = maxR; r > 0; r -= maxR / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross lines
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - maxR * 0.7, cy - maxR * 0.7); ctx.lineTo(cx + maxR * 0.7, cy + maxR * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + maxR * 0.7, cy - maxR * 0.7); ctx.lineTo(cx - maxR * 0.7, cy + maxR * 0.7); ctx.stroke();

      // Sweep gradient
      const sweepAngle = Math.PI / 2;
      // Draw sweep as a filled arc
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      sweepGrad.addColorStop(0, 'rgba(59,130,246,0.3)');
      sweepGrad.addColorStop(1, 'rgba(59,130,246,0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angleRef.current - sweepAngle, angleRef.current);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angleRef.current), cy + maxR * Math.sin(angleRef.current));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      angleRef.current += 0.02;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [theme]);

  return (
    <canvas ref={canvasRef} width={200} height={200}
      style={{ width: 200, height: 200, display: 'block' }}/>
  );
}

export default function TrendRadar({ onBack, theme, toggleTheme }: { onBack: () => void; theme: Theme; toggleTheme: () => void }) {
  const [data, setData] = useState<RadarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const accent = '#3b82f6';

  const fetchRadar = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/radar?limit=12`);
      const result = await response.json();
      setData(result);
    } catch {
      setError('Cannot connect to backend. Make sure it\'s running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRadar(); }, []);

  const categories = data ? ['ALL', ...Array.from(new Set(data.topics.map(t => t.category)))] : ['ALL'];
  const filtered = data?.topics.filter(t => filter === 'ALL' || t.category === filter) || [];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <header style={{ padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${border}`, background: isDark ? '#060c1aee' : '#f8fafc',
        position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 13, marginRight: 4 }}>← Back</button>
          <svg width="28" height="28" viewBox="0 0 56 56">
            <rect width="56" height="56" rx="14" fill="#0f172a"/>
            <polyline points="8,28 16,28 20,14 24,40 28,22 32,34 36,28 48,28" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="48" cy="28" r="3" fill="#10b981"/>
          </svg>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18 }}>signal<span style={{ color: accent }}>.</span>repair</span>
          <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>/ trend radar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
        <motion.button onClick={fetchRadar} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ padding: '8px 18px', borderRadius: 100, border: `1px solid ${border}`, background: card,
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, color: loading ? muted : text,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {loading ? 'Scanning...' : 'Refresh'}
        </motion.button>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* Hero section with radar visual */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 12 }}>
              TREND RADAR
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
              Global signal <em>intelligence</em>
            </h1>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, maxWidth: 400 }}>
              Real-time analysis of the world's most discussed and disputed topics. Powered by live web data and 3-model consensus.
            </p>
            {data && (
              <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                {[
                  { label: 'Topics Scanned', value: data.total },
                  { label: 'Disputed', value: data.most_disputed_count, color: '#d97706' },
                  { label: 'Avg Score', value: `${data.avg_signal_score}/100` },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: s.color || accent, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ background: isDark ? '#0d1526' : '#fff', borderRadius: '50%', border: `1px solid ${border}`, overflow: 'hidden' }}>
              <RadarSweep theme={theme}/>
            </div>
            {data && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>LIVE</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Category filter */}
        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding: '5px 14px', borderRadius: 100, border: `1px solid ${filter === cat ? accent : border}`,
                  background: filter === cat ? `${accent}18` : 'transparent',
                  cursor: 'pointer', fontSize: 11, fontWeight: filter === cat ? 700 : 400,
                  color: filter === cat ? accent : muted, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                {cat === 'ALL' ? `All (${data.total})` : `${cat} (${data.topics.filter(t => t.category === cat).length})`}
              </button>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {loading && !data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <RadarSweep theme={theme}/>
            </div>
            <div style={{ fontSize: 13, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
              Scanning global topics...
            </div>
            <div style={{ fontSize: 11, color: isDark ? '#1e293b' : '#cbd5e1', marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              This takes 30-60 seconds — analyzing 12 topics with live sources
            </div>
          </motion.div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Topic grid */}
        {filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filtered.map((topic, i) => {
              const vc = VERDICT_COLORS[topic.verdict] || '#6b7280';
              const vbg = VERDICT_BG[topic.verdict] || '#f3f4f6';
              const catColor = CATEGORY_COLORS[topic.category] || accent;
              const isExp = expanded === topic.topic;

              return (
                <motion.div key={topic.topic}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 14,
                    overflow: 'hidden', borderLeft: `3px solid ${vc}`, cursor: 'pointer' }}
                  onClick={() => setExpanded(isExp ? null : topic.topic)}>

                  <div style={{ padding: '16px 18px' }}>
                    {/* Category badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: catColor, background: `${catColor}18`,
                        padding: '2px 8px', borderRadius: 100, fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.08em', border: `1px solid ${catColor}33` }}>
                        {topic.category.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: vc, background: `${vc}18`,
                        padding: '2px 8px', borderRadius: 100, fontFamily: "'JetBrains Mono', monospace" }}>
                        {topic.verdict}
                      </span>
                    </div>

                    {/* Topic name */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: text, lineHeight: 1.4, marginBottom: 10 }}>
                      {topic.topic}
                    </div>

                    {/* Score bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${topic.signal_score}%` }}
                          transition={{ duration: 1, delay: i * 0.05, ease: 'easeOut' }}
                          style={{ height: '100%', background: vc, borderRadius: 3 }}/>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: vc, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {topic.signal_score}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${border}` }}>
                        <div style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, color: muted, lineHeight: 1.65, marginBottom: 10 }}>{topic.summary}</p>
                          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                            <span>{topic.source_count} sources</span>
                            <span>{topic.contradiction_count} contradictions</span>
                            <span style={{ color: topic.consensus_confidence === 'UNANIMOUS' ? '#16a34a' : topic.consensus_confidence === 'HIGH' ? '#d97706' : '#dc2626' }}>
                              {topic.consensus_confidence}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Verdict distribution */}
        {data && data.verdict_counts && Object.keys(data.verdict_counts).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginTop: 20 }}>
            <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 16 }}>
              GLOBAL VERDICT DISTRIBUTION
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(data.verdict_counts).map(([verdict, count]) => {
                const vc = VERDICT_COLORS[verdict] || '#6b7280';
                const pct = Math.round((count / data.total) * 100);
                return (
                  <div key={verdict} style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: vc, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{verdict}</span>
                      <span style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: vc, borderRadius: 2 }}/>
                    </div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{count} topics</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}