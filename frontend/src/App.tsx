import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsensusPanel from './ConsensusPanel';
import ThemeToggle from './ThemeToggle';
import HallucinationExamples from './HallucinationExamples';
import SourceGraph from './SourceGraph';

const API = 'http://localhost:8080';

type Verdict = 'TRUE' | 'MOSTLY_TRUE' | 'DISPUTED' | 'OUTDATED' | 'FALSE' | 'NOISE';
type Theme = 'dark' | 'light';
type AgentStatus = 'idle' | 'running' | 'done';

interface Source { url: string; title: string; snippet: string; credibility_score: number; stance: string; }
interface Contradiction { source_a: string; source_b: string; description: string; }
interface IndividualVerdict { persona: string; model: string; verdict: string; score: number; }
interface RepairResult {
  input: string; verdict: Verdict; signal_score: number; summary: string;
  what_is_accurate: string; what_is_noise: string; what_changed?: string;
  sources: Source[]; contradictions: Contradiction[]; repair: string; agent_trace: string[];
  consensus_confidence?: string; individual_verdicts?: IndividualVerdict[];
}

function VerdictIcon({ icon, size = 16, color = 'currentColor' }: { icon: string; size?: number; color?: string }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  if (icon === 'check') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  if (icon === 'x') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
  if (icon === 'alert') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 20 2 20" fill="none"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (icon === 'clock') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  if (icon === 'radio') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2"/>
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
    </svg>
  );
  return <span style={{ color, fontWeight: 700 }}>?</span>;
}


const VERDICT_CONFIG: Record<Verdict, { color: string; bg: string; label: string; icon: string }> = {
  TRUE:        { color: '#16a34a', bg: '#dcfce7', label: 'Verified True',  icon: 'check' },
  MOSTLY_TRUE: { color: '#65a30d', bg: '#ecfccb', label: 'Mostly True',    icon: 'check' },
  DISPUTED:    { color: '#d97706', bg: '#fef3c7', label: 'Disputed',       icon: 'alert' },
  OUTDATED:    { color: '#ea580c', bg: '#ffedd5', label: 'Outdated',       icon: 'clock' },
  FALSE:       { color: '#dc2626', bg: '#fee2e2', label: 'False',          icon: 'x' },
  NOISE:       { color: '#6b7280', bg: '#f3f4f6', label: 'Noise',          icon: 'radio' },
};


const DEMO_CLAIMS = [
  { label: "Great Wall", text: "The Great Wall of China is visible from space", mode: "claim" },
  { label: "Einstein", text: "Albert Einstein failed mathematics in school", mode: "hallucination" },
  { label: "10% Brain", text: "Humans only use 10% of their brain capacity", mode: "claim" },
  { label: "Nuclear Fusion", text: "Current state of nuclear fusion energy", mode: "topic" },
  { label: "Napoleon", text: "Napoleon Bonaparte was extremely short, standing at only 5 feet 2 inches", mode: "hallucination" },
];

const MODES = [
  { value: 'claim', label: 'Claim', icon: null },
  { value: 'topic', label: 'Topic', icon: null },
  { value: 'hallucination', label: 'AI Check', icon: null },
  { value: 'url', label: 'URL', icon: null },
];

const PLACEHOLDERS: Record<string, string> = {
  claim: '"The Great Wall of China is visible from space"',
  topic: '"Current state of nuclear fusion energy"',
  hallucination: 'Paste any AI-generated text to check for hallucinations...',
  url: 'https://example.com/article-to-verify',
};

function EKGMeter({ score, verdict, theme }: { score: number; verdict: Verdict; theme: Theme }) {
  const config = VERDICT_CONFIG[verdict];
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const amplitude = (score / 100) * (h * 0.38);
    const baseline = h * 0.62;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.beginPath();
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      const segW = 80;
      const totalSegs = Math.ceil(w / segW) + 1;
      const offset = offsetRef.current % segW;
      for (let i = -1; i < totalSegs; i++) {
        const x = i * segW - offset;
        if (score < 15) {
          ctx.moveTo(x, baseline + (Math.random() * 3 - 1.5));
          ctx.lineTo(x + segW, baseline + (Math.random() * 3 - 1.5));
        } else {
          ctx.moveTo(x, baseline);
          ctx.lineTo(x + segW * 0.28, baseline);
          ctx.lineTo(x + segW * 0.35, baseline - amplitude * 0.25);
          ctx.lineTo(x + segW * 0.42, baseline - amplitude);
          ctx.lineTo(x + segW * 0.48, baseline + amplitude * 0.45);
          ctx.lineTo(x + segW * 0.54, baseline);
          ctx.lineTo(x + segW * 0.64, baseline);
          ctx.lineTo(x + segW * 0.68, baseline - amplitude * 0.18);
          ctx.lineTo(x + segW * 0.72, baseline);
          ctx.lineTo(x + segW, baseline);
        }
      }
      ctx.stroke();
      offsetRef.current += 1.2;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [score, verdict, theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="58" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="8"/>
          <motion.circle cx="70" cy="70" r="58" fill="none" stroke={config.color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 58}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - score / 100) }}
            transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            style={{ fontSize: '38px', fontWeight: 700, color: config.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {score}
          </motion.div>
          <div style={{ fontSize: '10px', color: isDark ? '#475569' : '#94a3b8', letterSpacing: '0.1em', marginTop: 2 }}>SCORE</div>
        </div>
      </div>
      <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, background: isDark ? '#060c1a' : '#f8fafc' }}>
        <canvas ref={canvasRef} width={500} height={72} style={{ width: '100%', height: 72, display: 'block' }}/>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 100,
          background: config.bg, color: config.color, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em',
          border: `1.5px solid ${config.color}44`, fontFamily: "'JetBrains Mono', monospace" }}>
        <VerdictIcon icon={config.icon} size={16} color={config.color}/> {config.label.toUpperCase()}
      </motion.div>
    </div>
  );
}

function AgentPipeline({ agents, traces }: { agents: Record<string, AgentStatus>; traces: string[] }) {
  const steps = [
    { key: 'scout', label: 'Scout Agent', sub: 'Searching live web via Tavily', icon: '01' },
    { key: 'critic', label: 'Critic Agent', sub: 'Finding contradictions', icon: '02' },
    { key: 'synthesis', label: 'Synthesis Agent', sub: 'Running Consensus Engine (3 models)', icon: '03' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, i) => {
        const status = agents[step.key] || 'idle';
        const color = status === 'done' ? '#16a34a' : status === 'running' ? '#3b82f6' : '#94a3b8';
        const bg = status === 'done' ? '#dcfce711' : status === 'running' ? '#dbeafe11' : 'transparent';
        return (
          <motion.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: status === 'idle' ? 0.4 : 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12,
              border: `1px solid ${status === 'running' ? '#3b82f644' : status === 'done' ? '#16a34a44' : '#1e293b'}`,
              background: bg, transition: 'all 0.3s' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: status === 'done' ? '#dcfce7' : status === 'running' ? '#dbeafe' : 'transparent',
              border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color, flexShrink: 0, transition: 'all 0.3s' }}>
              {status === 'done' ? '' : step.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: status === 'idle' ? '#475569' : '#e2e8f0' }}>{step.label}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{step.sub}</div>
            </div>
            {status === 'running' && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3,1,0.3], scaleY: [0.6,1,0.6] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: 3, height: 16, borderRadius: 2, background: '#3b82f6' }}/>
                ))}
              </div>
            )}
            {status === 'done' && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                style={{ fontSize: 11, color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>DONE</motion.div>
            )}
          </motion.div>
        );
      })}
      {traces.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 4, padding: '10px 14px', borderRadius: 10, background: '#060c1a', border: '1px solid #1e293b',
            maxHeight: 100, overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          {traces.slice(-5).map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{ color: '#475569', marginBottom: 3, borderLeft: '2px solid #1e293b', paddingLeft: 8 }}>
              {t}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function App({ onBack, theme: themeProp, toggleTheme: toggleThemeProp }: { onBack?: () => void; theme?: Theme; toggleTheme?: () => void }) {
  const [themeLocal, setThemeLocal] = useState<Theme>('dark');
  const theme = themeProp || themeLocal;
  const toggleTheme = toggleThemeProp || (() => setThemeLocal(t => t === 'dark' ? 'light' : 'dark'));
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('claim');
  const [streaming, setStreaming] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({});
  const [traces, setTraces] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState('');
  const [traceOpen, setTraceOpen] = useState(false);

  const handleExampleSelect = (text: string) => {
    setInput(text);
    setMode('hallucination');
  };

  

  const isDark = theme === 'dark';
  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const accent = '#3b82f6';

  const handleRepair = async () => {
    if (!input.trim() || streaming) return;
    setStreaming(true); setResult(null); setSources([]); setContradictions([]);
    setTraces([]); setAgents({}); setError('');
    try {
      const response = await fetch(`${API}/repair/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'agent') { setAgents(prev => ({ ...prev, [event.agent]: event.status })); setTraces(prev => [...prev, event.message]); }
            else if (event.type === 'trace') { setTraces(prev => [...prev, event.message]); }
            else if (event.type === 'sources') { setSources(event.sources); }
            else if (event.type === 'contradictions') { setContradictions(event.contradictions); }
            else if (event.type === 'result') { setResult(event.result); }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || 'Cannot connect to backend on port 8080.');
    } finally { setStreaming(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'DM Sans', -apple-system, sans-serif", transition: 'all 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { resize: none; font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
      `}</style>

      <header style={{ padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${border}`, background: isDark ? '#060c1aee' : '#f8fafc', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 13, marginRight: 4 }}>← Back</button>}
          <svg width="30" height="30" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
            <rect width="56" height="56" rx="14" fill="#0f172a"/>
            <polyline points="8,28 16,28 20,14 24,40 28,22 32,34 36,28 48,28" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="48" cy="28" r="3" fill="#10b981"/>
          </svg>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20 }}>signal<span style={{ color: accent }}>.</span>repair</span>
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme}/>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 8 }}>
            Repair broken <em>information signals</em>
          </h1>
          <p style={{ fontSize: 14, color: muted }}>Three AI agents. Live web search. Consensus verdict.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 20,
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Demo claims */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 6 }}>
              TRY THESE
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEMO_CLAIMS.map((demo, i) => (
                <motion.button key={i}
                  onClick={() => { setInput(demo.text); setMode(demo.mode); }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${border}`,
                    background: 'transparent', cursor: 'pointer', fontSize: 11, color: muted,
                    fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
                  {demo.label}
                </motion.button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: isDark ? '#0a0f1e' : '#f1f5f9', padding: 4, borderRadius: 10 }}>
            {MODES.map(m => (
              <button key={m.value} onClick={() => setMode(m.value)} style={{
                flex: 1, padding: '7px 6px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: mode === m.value ? (isDark ? '#1e293b' : '#fff') : 'transparent',
                color: mode === m.value ? text : muted,
                boxShadow: mode === m.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'hallucination' && <HallucinationExamples onSelect={handleExampleSelect} theme={theme}/>}
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRepair(); }}
            placeholder={PLACEHOLDERS[mode]} rows={4}
            style={{ width: '100%', background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}`,
              borderRadius: 10, padding: '12px 14px', color: text, fontSize: 14, lineHeight: 1.6, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = border}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>+Enter to run</span>
            <motion.button onClick={handleRepair} disabled={streaming || !input.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '10px 24px', borderRadius: 100, border: 'none', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                background: streaming || !input.trim() ? (isDark ? '#1e293b' : '#e2e8f0') : `linear-gradient(135deg, ${accent}, #10b981)`,
                color: streaming || !input.trim() ? muted : '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: streaming || !input.trim() ? 'none' : '0 4px 20px rgba(59,130,246,0.3)', transition: 'all 0.3s' }}>
              {streaming ? 'Repairing...' : 'Repair Signal'}
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
             {error}
          </motion.div>
        )}

        <AnimatePresence>
          {(streaming || traces.length > 0) && !result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 16 }}>AGENT PIPELINE — LIVE</div>
              <AgentPipeline agents={agents} traces={traces}/>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: card, border: `1px solid ${VERDICT_CONFIG[result.verdict].color}44`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
                <EKGMeter score={result.signal_score} verdict={result.verdict} theme={theme}/>
              </motion.div>

              {result.consensus_confidence && result.individual_verdicts && (
                <ConsensusPanel confidence={result.consensus_confidence} verdicts={result.individual_verdicts} theme={theme}/>
              )}

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>SUMMARY</div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: text }}>{result.summary}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: card, border: '1px solid #bbf7d0', borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, color: '#16a34a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}> ACCURATE</div>
                  <p style={{ fontSize: 13, color: text, lineHeight: 1.65 }}>{result.what_is_accurate}</p>
                </div>
                <div style={{ background: card, border: '1px solid #fecaca', borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}> NOISE</div>
                  <p style={{ fontSize: 13, color: text, lineHeight: 1.65 }}>{result.what_is_noise}</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ background: isDark ? '#0d1e35' : '#eff6ff', border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>REPAIRED SIGNAL</div>
                <p style={{ fontSize: 15, color: text, lineHeight: 1.75, fontStyle: 'italic', fontFamily: "'Instrument Serif', serif" }}>{result.repair}</p>
              </motion.div>

              {result.sources.length > 0 && (
                <SourceGraph sources={result.sources} contradictions={result.contradictions} theme={theme}/>
              )}

              {result.sources.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 10 }}>
                    SOURCES ({result.sources.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.sources.map((s, i) => {
                      const sc = s.stance === 'supports' ? '#16a34a' : s.stance === 'contradicts' ? '#dc2626' : muted;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 16px', borderLeft: `3px solid ${sc}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.3 }}>{s.title}</div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: `${sc}18`, color: sc, fontWeight: 700, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                              {s.stance}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: muted, lineHeight: 1.5, marginBottom: 8 }}>{s.snippet.slice(0, 130)}...</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: muted }}>
                              Credibility: <b style={{ color: s.credibility_score > 0.7 ? '#16a34a' : s.credibility_score > 0.4 ? '#d97706' : '#dc2626' }}>
                                {Math.round(s.credibility_score * 100)}%
                              </b>
                            </span>
                            <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: accent, textDecoration: 'none' }}>View →</a>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {result.contradictions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ background: card, border: '1px solid #fde68a', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 10, color: '#d97706', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 12 }}>
                    CONTRADICTIONS ({result.contradictions.length})
                  </div>
                  {result.contradictions.map((c, i) => (
                    <div key={i} style={{ padding: 12, background: isDark ? '#0a0f1e' : '#fffbeb', borderRadius: 10, marginBottom: 8, borderLeft: '3px solid #fbbf24' }}>
                      <div style={{ fontSize: 11, color: '#d97706', marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{c.source_a} vs {c.source_b}</div>
                      <div style={{ fontSize: 13, color: text }}>{c.description}</div>
                    </div>
                  ))}
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                <button onClick={() => setTraceOpen(o => !o)} style={{ width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: muted, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>AGENT TRACE ({result.agent_trace.length} steps)</span>
                  <span style={{ fontSize: 10 }}>{traceOpen ? 'HIDE' : 'SHOW'}</span>
                </button>
                <AnimatePresence>
                  {traceOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {result.agent_trace.map((step, i) => (
                          <div key={i} style={{ fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace", padding: '5px 10px', borderRadius: 6,
                            background: isDark ? '#0a0f1e' : '#f8fafc', borderLeft: `2px solid ${border}` }}>
                            <span style={{ color: accent, marginRight: 8 }}>{String(i+1).padStart(2,'0')}</span>{step}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 60, textAlign: 'center', fontSize: 11, color: isDark ? '#1e293b' : '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>
          signal.repair — DeveloperWeek NYC 2026
        </div>
      </div>
    </div>
  );
}