import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = 'http://localhost:8080';
type Theme = 'dark' | 'light';

interface ClaimResult {
  claim: string;
  verdict: string;
  signal_score: number;
  summary: string;
  repair: string;
  source_count: number;
  consensus_confidence: string;
}

interface BattleResult {
  claim_a: ClaimResult;
  claim_b: ClaimResult;
  winner: 'A' | 'B' | 'TIE';
  margin: number;
  combined_score_a: number;
  combined_score_b: number;
  battle_verdict: string;
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#16a34a', MOSTLY_TRUE: '#65a30d', DISPUTED: '#d97706',
  OUTDATED: '#ea580c', FALSE: '#dc2626', NOISE: '#6b7280',
};

const VERDICT_EMOJI: Record<string, string> = {
  TRUE: '', MOSTLY_TRUE: '◐', DISPUTED: '!',
  OUTDATED: '○', FALSE: '', NOISE: '~',
};

const BATTLE_EXAMPLES = [
  { a: "Coffee is good for your health", b: "Coffee is bad for your health" },
  { a: "Nuclear energy is safe", b: "Nuclear energy is dangerous" },
  { a: "Social media improves mental health", b: "Social media damages mental health" },
  { a: "Remote work increases productivity", b: "Office work increases productivity" },
];

export default function ClaimBattle({ onBack, theme, toggleTheme }: { onBack: () => void; theme: Theme; toggleTheme: () => void }) {
  const [claimA, setClaimA] = useState('');
  const [claimB, setClaimB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const accent = '#3b82f6';

  const STEPS = ['Analyzing Claim A...', 'Analyzing Claim B...', 'Computing battle verdict...'];

  const handleBattle = async () => {
    if (!claimA.trim() || !claimB.trim() || loading) return;
    setLoading(true); setResult(null); setError(''); setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 5000);
    const t2 = setTimeout(() => setLoadingStep(2), 10000);
    try {
      const response = await fetch(`${API}/battle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_a: claimA, claim_b: claimB }),
      });
      const data = await response.json();
      if (data.detail) setError(data.detail);
      else setResult(data);
    } catch (e: any) {
      setError('Cannot connect to backend on port 8080.');
    } finally {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);
    }
  };

  const winnerA = result?.winner === 'A';
  const winnerB = result?.winner === 'B';
  const isTie = result?.winner === 'TIE';

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
          <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>/ claim battle</span>
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 20px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 12 }}>CLAIM BATTLE MODE</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
            Two claims enter. <em>One wins.</em>
          </h1>
          <p style={{ fontSize: 14, color: muted }}>Signal.repair runs both through the full pipeline and declares the winner based on evidence.</p>
        </motion.div>

        {/* Example battles */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>EXAMPLE BATTLES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BATTLE_EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => { setClaimA(ex.a); setClaimB(ex.b); }}
                style={{ padding: '5px 14px', borderRadius: 100, border: `1px solid ${border}`,
                  background: 'transparent', cursor: 'pointer', fontSize: 11, color: muted, fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
                {ex.a.slice(0, 20)}... vs {ex.b.slice(0, 20)}...
              </button>
            ))}
          </div>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }}>

          {/* Claim A */}
          <div style={{ background: card, border: `2px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>CLAIM A</div>
            <textarea value={claimA} onChange={e => setClaimA(e.target.value)} rows={4}
              placeholder="Enter first claim..."
              style={{ width: '100%', background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}`,
                borderRadius: 10, padding: '10px 12px', color: text, fontSize: 13, lineHeight: 1.6, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = border}/>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: isDark ? '#1e293b' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Instrument Serif', serif", fontSize: 20, color: text, fontWeight: 400 }}>
              vs
            </div>
          </div>

          {/* Claim B */}
          <div style={{ background: card, border: `2px solid ${isDark ? '#3f1515' : '#fecaca'}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 10, color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>CLAIM B</div>
            <textarea value={claimB} onChange={e => setClaimB(e.target.value)} rows={4}
              placeholder="Enter second claim..."
              style={{ width: '100%', background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}`,
                borderRadius: 10, padding: '10px 12px', color: text, fontSize: 13, lineHeight: 1.6, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = border}/>
          </div>
        </motion.div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.button onClick={handleBattle} disabled={loading || !claimA.trim() || !claimB.trim()}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '13px 36px', borderRadius: 100, border: 'none',
              cursor: loading || !claimA.trim() || !claimB.trim() ? 'not-allowed' : 'pointer',
              background: loading || !claimA.trim() || !claimB.trim() ? (isDark ? '#1e293b' : '#e2e8f0') : 'linear-gradient(135deg, #dc2626, #d97706)',
              color: loading || !claimA.trim() || !claimB.trim() ? muted : '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: loading || !claimA.trim() || !claimB.trim() ? 'none' : '0 4px 24px rgba(220,38,38,0.3)',
              transition: 'all 0.3s' }}>
            {loading ? 'Battle in progress...' : 'Start Battle'}
          </motion.button>
        </div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16, color: "#dc2626", fontWeight: 700, fontFamily: "serif" }}>VS</div>
              <AnimatePresence mode="wait">
                <motion.div key={loadingStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ fontSize: 14, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {STEPS[loadingStep]}
                </motion.div>
              </AnimatePresence>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: accent }}/>
                ))}
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

        {/* Battle Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Winner announcement */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
                style={{ background: card, border: `2px solid ${isTie ? '#d97706' : winnerA ? accent : '#dc2626'}44`,
                  borderRadius: 20, padding: 32, textAlign: 'center',
                  boxShadow: `0 0 60px ${isTie ? '#d97706' : winnerA ? accent : '#dc2626'}22` }}>
                
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, marginBottom: 12 }}>
                  {isTie ? "It's a Tie!" : `Claim ${result.winner} Wins!`}
                </div>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 20px', fontStyle: 'italic' }}>
                  "{result.battle_verdict}"
                </p>
                {!isTie && (
                  <div style={{ fontSize: 12, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                    Victory margin: <b style={{ color: winnerA ? accent : '#dc2626' }}>{result.margin} points</b>
                  </div>
                )}
              </motion.div>

              {/* Side by side scores */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { data: result.claim_a, label: 'A', isWinner: winnerA, color: accent },
                  { data: result.claim_b, label: 'B', isWinner: winnerB, color: '#dc2626' },
                ].map(({ data, label, isWinner, color }) => {
                  const vc = VERDICT_COLORS[data.verdict] || '#6b7280';
                  return (
                    <div key={label} style={{ background: card, border: `2px solid ${isWinner ? color + '66' : border}`,
                      borderRadius: 16, padding: 20, position: 'relative' }}>
                      {isWinner && (
                        <div style={{ position: 'absolute', top: -10, right: 16, background: color,
                          color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                          fontFamily: "'JetBrains Mono', monospace" }}>WINNER</div>
                      )}
                      <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>CLAIM {label}</div>
                      <p style={{ fontSize: 13, color: text, lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>"{data.claim}"</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: vc, background: `${vc}18`,
                          padding: '2px 8px', borderRadius: 100, fontFamily: "'JetBrains Mono', monospace" }}>
                          {VERDICT_EMOJI[data.verdict]} {data.verdict}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: vc, fontFamily: "'JetBrains Mono', monospace" }}>
                          {data.signal_score}/100
                        </span>
                      </div>

                      <div style={{ height: 6, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${data.signal_score}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{ height: '100%', background: vc, borderRadius: 3 }}/>
                      </div>

                      <p style={{ fontSize: 12, color: muted, lineHeight: 1.6, marginBottom: 10 }}>{data.summary}</p>

                      <div style={{ background: isDark ? '#0d1e35' : '#eff6ff', borderRadius: 10, padding: 12,
                        border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}` }}>
                        <div style={{ fontSize: 9, color: accent, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>⟳ REPAIRED</div>
                        <p style={{ fontSize: 12, color: text, lineHeight: 1.55, fontStyle: 'italic', fontFamily: "'Instrument Serif', serif" }}>{data.repair}</p>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 11, color: muted }}>
                        {data.source_count} sources · {data.consensus_confidence} consensus
                      </div>
                    </div>
                  );
                })}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}