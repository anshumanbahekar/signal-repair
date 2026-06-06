import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = 'http://localhost:8080';

type Theme = 'dark' | 'light';

interface HistoryRecord {
  id: string;
  timestamp: string;
  input: string;
  verdict: string;
  signal_score: number;
  summary: string;
  repair: string;
  source_count: number;
  contradiction_count: number;
  consensus_confidence: string;
}

interface Stats {
  total: number;
  avg_score: number;
  verdict_counts: Record<string, number>;
  confidence_counts: Record<string, number>;
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#16a34a', MOSTLY_TRUE: '#65a30d', DISPUTED: '#d97706',
  OUTDATED: '#ea580c', FALSE: '#dc2626', NOISE: '#6b7280',
};

const VERDICT_EMOJI: Record<string, string> = {
  TRUE: '', MOSTLY_TRUE: '~', DISPUTED: '!',
  OUTDATED: '↺', FALSE: '', NOISE: '—',
};

const CONFIDENCE_CONFIG: Record<string, { emoji: string; color: string }> = {
  UNANIMOUS: { emoji: '●', color: '#16a34a' },
  HIGH:      { emoji: '◐', color: '#d97706' },
  LOW:       { emoji: '●', color: '#dc2626' },
  UNKNOWN:   { emoji: '●', color: '#6b7280' },
};

function DonutChart({ data, theme }: { data: Record<string, number>; theme: Theme }) {
  const isDark = theme === 'dark';
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const segments: { verdict: string; count: number; startAngle: number; endAngle: number }[] = [];

  Object.entries(data).forEach(([verdict, count]) => {
    const startAngle = (cumulative / total) * 360;
    const endAngle = ((cumulative + count) / total) * 360;
    segments.push({ verdict, count, startAngle, endAngle });
    cumulative += count;
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {segments.map((seg, i) => (
          <motion.path key={i} d={describeArc(60, 60, 50, seg.startAngle, seg.endAngle)}
            fill={VERDICT_COLORS[seg.verdict] || '#6b7280'} opacity={0.85}
            initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: i * 0.1 }}/>
        ))}
        <circle cx="60" cy="60" r="28" fill={isDark ? '#0d1526' : '#ffffff'}/>
        <text x="60" y="56" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: isDark ? '#e2e8f0' : '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>{total}</text>
        <text x="60" y="70" textAnchor="middle" style={{ fontSize: 9, fill: '#6b7280', fontFamily: 'sans-serif' }}>REPAIRS</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: VERDICT_COLORS[seg.verdict] || '#6b7280', flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>{seg.verdict}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 100, theme }: { score: number; max?: number; theme: Theme }) {
  const isDark = theme === 'dark';
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(score / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 3 }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{score}</span>
    </div>
  );
}

export default function History({ onBack, theme, toggleTheme }: { onBack: () => void; theme: Theme; toggleTheme: () => void }) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const accent = '#3b82f6';

  useEffect(() => {
    fetch(`${API}/history?limit=100`)
      .then(r => r.json())
      .then(data => { setRecords(data.records || []); setStats(data.stats || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r =>
    r.input.toLowerCase().includes(search.toLowerCase()) ||
    r.verdict.toLowerCase().includes(search.toLowerCase())
  );

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
          <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>/ history</span>
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, marginBottom: 8 }}>
            Signal <em>History</em>
          </h1>
          <p style={{ fontSize: 14, color: muted }}>All past repairs stored in the Tower lakehouse pipeline.</p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Repairs', value: stats.total, icon: 'Σ' },
              { label: 'Avg Signal Score', value: stats.avg_score, icon: '~' },
              { label: 'Most Common', value: Object.entries(stats.verdict_counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A', icon: '' },
              { label: 'Unanimous', value: stats.confidence_counts['UNANIMOUS'] || 0, icon: '' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: accent, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Donut Chart + Confidence */}
        {stats && stats.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 16 }}>VERDICT DISTRIBUTION</div>
              <DonutChart data={stats.verdict_counts} theme={theme}/>
            </div>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 16 }}>CONSENSUS CONFIDENCE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(stats.confidence_counts).map(([conf, count], i) => {
                  const config = CONFIDENCE_CONFIG[conf] || CONFIDENCE_CONFIG.UNKNOWN;
                  const total = Object.values(stats.confidence_counts).reduce((a,b) => a+b, 0);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, color: config.color, lineHeight: 1 }}>●</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: text }}>{conf}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: config.color }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ height: '100%', background: config.color, borderRadius: 2 }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repairs..."
            style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px',
              color: text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = border}/>
        </motion.div>

        {/* Records */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: muted }}>Loading history...</div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: 60, color: muted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No repairs yet</div>
            <div style={{ fontSize: 13 }}>Run your first signal repair to see history here</div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((record, i) => {
              const verdictColor = VERDICT_COLORS[record.verdict] || '#6b7280';
              const isExpanded = expanded === record.id;
              const confConfig = CONFIDENCE_CONFIG[record.consensus_confidence] || CONFIDENCE_CONFIG.UNKNOWN;
              const date = new Date(record.timestamp);
              const timeAgo = getTimeAgo(date);

              return (
                <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden',
                    borderLeft: `3px solid ${verdictColor}` }}>
                  <div onClick={() => setExpanded(isExpanded ? null : record.id)}
                    style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{VERDICT_EMOJI[record.verdict] || '~'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 6, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.input}
                      </div>
                      <ScoreBar score={record.signal_score} theme={theme}/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: verdictColor, fontFamily: "'JetBrains Mono', monospace",
                        background: `${verdictColor}18`, padding: '2px 8px', borderRadius: 100 }}>
                        {record.verdict}
                      </span>
                      <span style={{ fontSize: 10, color: muted }}>{timeAgo}</span>
                      <span style={{ fontSize: 14, color: confConfig.color, lineHeight: 1 }}>●</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${border}` }}>
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>SUMMARY</div>
                            <p style={{ fontSize: 13, color: text, lineHeight: 1.65 }}>{record.summary}</p>
                          </div>
                          <div style={{ background: isDark ? '#0d1e35' : '#eff6ff', borderRadius: 10, padding: 14, border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}` }}>
                            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>REPAIRED SIGNAL</div>
                            <p style={{ fontSize: 13, color: text, lineHeight: 1.65, fontStyle: 'italic', fontFamily: "'Instrument Serif', serif" }}>{record.repair}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: muted }}>
                            <span>{record.source_count} sources</span>
                            <span>{record.contradiction_count} contradictions</span>
                            <span>{confConfig.emoji} {record.consensus_confidence} consensus</span>
                            <span>{date.toLocaleString()}</span>
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
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}