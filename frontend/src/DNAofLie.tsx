import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = 'http://localhost:8080';
type Theme = 'dark' | 'light';

interface TimelineNode {
  phase: string;
  year: string;
  title: string;
  description: string;
  source: string;
  color: string;
}

interface DNAResult {
  claim: string;
  dna_type: string;
  one_line_verdict: string;
  timeline: TimelineNode[];
  mutation_count: number;
  reach_estimate: string;
  why_it_spreads: string;
  the_truth: string;
  sources_used: number;
  error?: string;
}

const DNA_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  MYTH:     { color: '#8b5cf6', label: 'Ancient Myth' },
  MISINFO:  { color: '#ef4444', label: 'Misinformation' },
  OUTDATED: { color: '#f59e0b', label: 'Outdated Fact' },
  DISPUTED: { color: '#d97706', label: 'Disputed Claim' },
  PARTIAL:  { color: '#3b82f6', label: 'Partial Truth' },
};

const PHASE_ICONS: Record<string, React.ReactNode> = {
  ORIGIN: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  SPREAD: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  AMPLIFIED: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  CHALLENGED: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  DEBUNKED: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

const EXAMPLE_LIES = [
  "The Great Wall of China is visible from space",
  "We only use 10% of our brain",
  "Einstein failed math in school",
  "Lightning never strikes the same place twice",
  "Napoleon Bonaparte was very short",
];

export default function DNAofLie({ onBack, theme, toggleTheme }: { onBack: () => void; theme: Theme; toggleTheme: () => void }) {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DNAResult | null>(null);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const accent = '#3b82f6';

  const handleAnalyze = async () => {
    if (!claim.trim() || loading) return;
    setLoading(true); setResult(null); setError('');
    try {
      const response = await fetch(`${API}/dna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError('Cannot connect to backend on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  const dnaConfig = result ? (DNA_TYPE_CONFIG[result.dna_type] || DNA_TYPE_CONFIG.MYTH) : null;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { resize: none; font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
      `}</style>

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
          <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>/ dna of a lie</span>
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 12 }}>
            DNA OF A LIE
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
            How does a <em>lie spread?</em>
          </h1>
          <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>
            Enter any false claim. Signal.repair traces its origin, how it spread, when it was challenged, and how it was debunked.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>FAMOUS MYTHS TO ANALYZE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLE_LIES.map((ex, i) => (
                <button key={i} onClick={() => setClaim(ex)}
                  style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${border}`,
                    background: 'transparent', cursor: 'pointer', fontSize: 11, color: muted, fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
                  {ex.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input value={claim} onChange={e => setClaim(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="Enter any false claim or myth..."
              style={{ flex: 1, background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}`,
                borderRadius: 10, padding: '12px 14px', color: text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = border}/>
            <motion.button onClick={handleAnalyze} disabled={loading || !claim.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none',
                cursor: loading || !claim.trim() ? 'not-allowed' : 'pointer',
                background: loading || !claim.trim() ? (isDark ? '#1e293b' : '#e2e8f0') : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: loading || !claim.trim() ? muted : '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                boxShadow: loading || !claim.trim() ? 'none' : '0 4px 20px rgba(139,92,246,0.3)',
                transition: 'all 0.3s' }}>
              {loading ? 'Tracing...' : 'Trace DNA'}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 32, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {['ORIGIN', 'SPREAD', 'AMPLIFIED', 'CHALLENGED', 'DEBUNKED'].map((phase, i) => (
                  <motion.div key={phase}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 8, height: 8, borderRadius: '50%',
                      background: ['#6366f1','#f59e0b','#ef4444','#8b5cf6','#10b981'][i] }}/>
                ))}
              </div>
              <div style={{ fontSize: 13, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                Tracing the DNA of this lie...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
            {error}
          </motion.div>
        )}

        {/* DNA Result */}
        <AnimatePresence>
          {result && dnaConfig && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Header card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: card, border: `2px solid ${dnaConfig.color}44`, borderRadius: 20, padding: 28,
                  boxShadow: isDark ? `0 0 40px ${dnaConfig.color}11` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 100,
                      background: `${dnaConfig.color}18`, border: `1px solid ${dnaConfig.color}44`,
                      color: dnaConfig.color, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.08em', marginBottom: 12 }}>
                      {dnaConfig.label.toUpperCase()}
                    </div>
                    <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 400, color: text, lineHeight: 1.3, marginBottom: 8 }}>
                      "{result.claim}"
                    </h2>
                    <p style={{ fontSize: 14, color: muted, fontStyle: 'italic', lineHeight: 1.6 }}>{result.one_line_verdict}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${border}` }}>
                  {[
                    { label: 'Mutations', value: result.mutation_count },
                    { label: 'Estimated Reach', value: result.reach_estimate },
                    { label: 'Sources Used', value: result.sources_used },
                    { label: 'Timeline Phases', value: result.timeline?.length || 0 },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: dnaConfig.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 28, overflow: 'hidden' }}>
                  <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 28 }}>
                    MISINFORMATION TIMELINE
                  </div>

                  {/* Horizontal timeline */}
                  <div style={{ position: 'relative', paddingBottom: 8 }}>
                    {/* Connecting line */}
                    <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 2,
                      background: `linear-gradient(90deg, ${result.timeline.map(n => n.color).join(', ')})`,
                      opacity: 0.3, borderRadius: 1 }}/>

                    {/* Nodes */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.timeline.length}, 1fr)`, gap: 8 }}>
                      {result.timeline.map((node, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          {/* Phase dot */}
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${node.color}22`,
                            border: `2px solid ${node.color}`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: node.color, position: 'relative', zIndex: 1,
                            boxShadow: `0 0 12px ${node.color}44` }}>
                            {PHASE_ICONS[node.phase]}
                          </div>

                          {/* Content */}
                          <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: node.color,
                              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: 3 }}>
                              {node.phase}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: accent,
                              fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                              {node.year}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: text, marginBottom: 6, lineHeight: 1.3 }}>
                              {node.title}
                            </div>
                            <div style={{ fontSize: 11, color: muted, lineHeight: 1.5, marginBottom: 6 }}>
                              {node.description}
                            </div>
                            <div style={{ fontSize: 10, color: node.color, fontStyle: 'italic',
                              background: `${node.color}11`, padding: '2px 8px', borderRadius: 100,
                              display: 'inline-block', border: `1px solid ${node.color}33` }}>
                              {node.source}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Why it spreads + The truth */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: card, border: `1px solid ${isDark ? '#fbbf2433' : '#fde68a'}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 10, color: '#d97706', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 10 }}>
                    WHY IT SPREADS
                  </div>
                  <p style={{ fontSize: 13, color: text, lineHeight: 1.65 }}>{result.why_it_spreads}</p>
                </div>
                <div style={{ background: isDark ? '#0d1e35' : '#eff6ff', border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 10 }}>
                    THE TRUTH
                  </div>
                  <p style={{ fontSize: 13, color: text, lineHeight: 1.65, fontStyle: 'italic', fontFamily: "'Instrument Serif', serif" }}>
                    {result.the_truth}
                  </p>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}