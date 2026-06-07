import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = 'https://signal-repair-production.up.railway.app';
type Theme = 'dark' | 'light';

interface ClaimResult {
  claim: string;
  verdict: string;
  signal_score: number;
  repair: string;
  source_count: number;
  consensus_confidence: string;
}

interface URLResult {
  url: string;
  title: string;
  article_preview: string;
  claims_analyzed: number;
  overall_credibility: string;
  overall_score: number;
  verdict_counts: Record<string, number>;
  claim_results: ClaimResult[];
  error?: string;
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#16a34a', MOSTLY_TRUE: '#65a30d', DISPUTED: '#d97706',
  OUTDATED: '#ea580c', FALSE: '#dc2626', NOISE: '#6b7280',
};

const VERDICT_EMOJI: Record<string, string> = {
  TRUE: '', MOSTLY_TRUE: '◐', DISPUTED: '!',
  OUTDATED: '○', FALSE: '', NOISE: '~',
};

const CREDIBILITY_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  CREDIBLE:     { color: '#16a34a', bg: '#dcfce7', emoji: '' },
  MIXED:        { color: '#d97706', bg: '#fef3c7', emoji: '!' },
  QUESTIONABLE: { color: '#ea580c', bg: '#ffedd5', emoji: '' },
  UNRELIABLE:   { color: '#dc2626', bg: '#fee2e2', emoji: '' },
};

const EXAMPLE_URLS = [
  { label: "BBC News", url: "https://www.bbc.com/news/science-environment" },
  { label: "Reuters", url: "https://www.reuters.com/technology" },
  { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Artificial_intelligence" },
];

export default function URLAnalyzer({ onBack, theme, toggleTheme }: { onBack: () => void; theme: Theme; toggleTheme: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<URLResult | null>(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const accent = '#3b82f6';

  const LOADING_STEPS = [
    'Fetching article content...',
    'Extracting factual claims...',
    'Verifying claim 1 of 5...',
    'Verifying claim 2 of 5...',
    'Verifying claim 3 of 5...',
    'Computing credibility score...',
  ];

  const handleAnalyze = async () => {
    if (!url.trim() || loading) return;
    setLoading(true); setResult(null); setError(''); setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 4000);

    try {
      const response = await fetch(`${API}/analyze/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch (e: any) {
      setError('Cannot connect to backend. Make sure it\'s running on port 8080.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const credConfig = result ? (CREDIBILITY_CONFIG[result.overall_credibility] || CREDIBILITY_CONFIG.MIXED) : null;

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
          <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>/ url analyzer</span>
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 20px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 12 }}>URL ANALYZER</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
            Analyze any article's <em>credibility</em>
          </h1>
          <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>
            Paste any URL. Signal.repair extracts every factual claim and verifies each one with live web sources.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>

          {/* Example URLs */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>TRY THESE</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXAMPLE_URLS.map((ex, i) => (
                <button key={i} onClick={() => setUrl(ex.url)}
                  style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${border}`,
                    background: 'transparent', cursor: 'pointer', fontSize: 11, color: muted, fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="https://example.com/article..."
              style={{ flex: 1, background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}`,
                borderRadius: 10, padding: '12px 14px', color: text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = border}/>
            <motion.button onClick={handleAnalyze} disabled={loading || !url.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                background: loading || !url.trim() ? (isDark ? '#1e293b' : '#e2e8f0') : `linear-gradient(135deg, ${accent}, #10b981)`,
                color: loading || !url.trim() ? muted : '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                whiteSpace: 'nowrap', boxShadow: loading || !url.trim() ? 'none' : '0 4px 20px rgba(59,130,246,0.3)', transition: 'all 0.3s' }}>
              {loading ? 'Analyzing...' : 'Analyze URL'}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ height: ['8px','24px','8px'] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: 4, background: accent, borderRadius: 2 }}/>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={loadingStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ fontSize: 13, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {LOADING_STEPS[loadingStep]}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 11, color: isDark ? '#1e293b' : '#cbd5e1', marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                This may take 20-30 seconds — verifying each claim with live sources
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
             {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && credConfig && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Overall credibility */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: card, border: `2px solid ${credConfig.color}44`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 16 }}>OVERALL CREDIBILITY</div>
                <div style={{ fontSize: 64, marginBottom: 12 }}>{credConfig.emoji}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 28px', borderRadius: 100,
                  background: credConfig.bg, color: credConfig.color, fontSize: 18, fontWeight: 800,
                  border: `2px solid ${credConfig.color}44`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
                  {result.overall_credibility}
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: text, marginBottom: 8 }}>
                  {result.title || result.url}
                </div>
                <div style={{ fontSize: 13, color: muted }}>{result.claims_analyzed} claims analyzed · Average score: <b style={{ color: credConfig.color }}>{result.overall_score}/100</b></div>

                {/* Score bar */}
                <div style={{ marginTop: 16, height: 8, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 4, overflow: 'hidden', maxWidth: 400, margin: '16px auto 0' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.overall_score}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ height: '100%', background: credConfig.color, borderRadius: 4 }}/>
                </div>

                {/* Verdict breakdown */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  {Object.entries(result.verdict_counts).map(([verdict, count]) => (
                    <div key={verdict} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100,
                      background: `${VERDICT_COLORS[verdict] || '#6b7280'}18`, border: `1px solid ${VERDICT_COLORS[verdict] || '#6b7280'}44` }}>
                      <span style={{ fontSize: 12 }}>{VERDICT_EMOJI[verdict]}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: VERDICT_COLORS[verdict] || '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>{count}x {verdict}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Article preview */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>ARTICLE PREVIEW</div>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.65 }}>{result.article_preview}</p>
                <a href={result.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: accent, display: 'inline-block', marginTop: 10 }}>
                  Read full article →
                </a>
              </motion.div>

              {/* Claim results */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 12 }}>
                  CLAIMS ANALYZED ({result.claim_results.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.claim_results.map((claim, i) => {
                    const vColor = VERDICT_COLORS[claim.verdict] || '#6b7280';
                    const isExp = expanded === i;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${vColor}` }}>
                        <div onClick={() => setExpanded(isExp ? null : i)}
                          style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{VERDICT_EMOJI[claim.verdict]}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.4, marginBottom: 6 }}>{claim.claim}</div>
                            <div style={{ height: 4, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${claim.signal_score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                                style={{ height: '100%', background: vColor, borderRadius: 2 }}/>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: vColor, fontFamily: "'JetBrains Mono', monospace",
                              background: `${vColor}18`, padding: '2px 8px', borderRadius: 100 }}>{claim.verdict}</span>
                            <span style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>{claim.signal_score}/100</span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExp && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden', borderTop: `1px solid ${border}` }}>
                              <div style={{ padding: '14px 18px' }}>
                                <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>REPAIRED SIGNAL</div>
                                <p style={{ fontSize: 13, color: text, lineHeight: 1.65, fontStyle: 'italic', fontFamily: "'Instrument Serif', serif", marginBottom: 10 }}>
                                  {claim.repair}
                                </p>
                                <div style={{ fontSize: 11, color: muted }}>
                                  {claim.source_count} sources · {claim.consensus_confidence} consensus
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}