import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

type Theme = 'dark' | 'light';

const DEMO_ITEMS = [
  { claim: "The Great Wall of China is visible from space", verdict: "FALSE", score: 10, color: "#dc2626", emoji: "" },
  { claim: "Humans only use 10% of their brains", verdict: "FALSE", score: 8, color: "#dc2626", emoji: "" },
  { claim: "AI will surpass human intelligence by 2030", verdict: "DISPUTED", score: 48, color: "#d97706", emoji: "!" },
  { claim: "Coffee is the world's most consumed beverage", verdict: "FALSE", score: 22, color: "#dc2626", emoji: "" },
  { claim: "Lightning never strikes the same place twice", verdict: "FALSE", score: 12, color: "#dc2626", emoji: "" },
];

const FEATURES = [
  { icon: "scout", title: "Scout Agent", desc: "Searches 50+ live sources simultaneously via Tavily's real-time web intelligence." },
  { icon: "critic", title: "Critic Agent", desc: "Scores source credibility, assigns stances, and surfaces contradictions between sources." },
  { icon: "consensus", title: "Consensus Engine", desc: "Runs 3 AI models in parallel. Unanimous = verified. Disagreement = disputed. No single point of failure." },
  { icon: "watch", title: "Signal Watch", desc: "Continuously monitors topics over time. Detects when information changes or goes stale." },
  { icon: "hallucination", title: "Hallucination Repair", desc: "Paste any AI output. Every factual error gets flagged and a correction is suggested." },
  { icon: "api", title: "Public API", desc: "POST /repair — integrate signal intelligence into any app, agent, or workflow." },
];

const HOW_IT_WORKS = [
  { num: "01", icon: "search", title: "Scout searches the live web", color: "#3b82f6", desc: "Deploys across news, forums, academic sources using Tavily's APIs. Pulls real-time results, not cached data." },
  { num: "02", icon: "critic", title: "Critic finds contradictions", color: "#f59e0b", desc: "Analyzes every source for stance, scores domain credibility, and flags where sources disagree with each other." },
  { num: "03", icon: "consensus", title: "Consensus Engine decides", color: "#10b981", desc: "3 AI models vote in parallel on the verdict. Majority wins. All agree = UNANIMOUS. All disagree = DISPUTED automatically." },
];

export default function Landing({ onGetStarted, onHistory, onURLAnalyzer, onBattle, onRadar, onDNA, theme, toggleTheme }: {
  onGetStarted: () => void;
  onHistory: () => void;
  onURLAnalyzer: () => void;
  onBattle: () => void;
  onRadar: () => void;
  onDNA: () => void;
  theme: Theme;
  toggleTheme: () => void;
}) {
  const [activeClaim, setActiveClaim] = useState(0);
  const isDark = theme === 'dark';

  const bg = isDark ? '#060c1a' : '#f8fafc';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const FEATURE_ICONS: Record<string, React.ReactNode> = {
    scout: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    critic: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    consensus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>,
    watch: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    hallucination: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    api: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  };

  const HOW_ICONS: Record<string, React.ReactNode> = {
    search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    critic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
    consensus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };

  const accent = '#3b82f6';

  useEffect(() => {
    const t = setInterval(() => setActiveClaim(i => (i + 1) % DEMO_ITEMS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'DM Sans', -apple-system, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
        a { text-decoration: none; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: isDark ? '#060c1aee' : '#f8fafc', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
            <rect width="56" height="56" rx="14" fill="#0f172a"/>
            <polyline points="8,28 16,28 20,14 24,40 28,22 32,34 36,28 48,28" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="48" cy="28" r="3" fill="#10b981"/>
          </svg>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20 }}>signal<span style={{ color: accent }}>.</span>repair</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: isDark ? '#0d1526' : '#f1f5f9', padding: '4px', borderRadius: 12, border: `1px solid ${border}` }}>
            {[
              { label: 'Features', href: '#features', onClick: undefined },
              { label: 'How it works', href: '#how-it-works', onClick: undefined },
              { label: 'Battle', href: undefined, onClick: onBattle },
              { label: 'Radar', href: undefined, onClick: onRadar },
              { label: 'DNA', href: undefined, onClick: onDNA },
              { label: 'URL Analyzer', href: undefined, onClick: onURLAnalyzer },
              { label: 'History', href: undefined, onClick: onHistory },
            ].map((item, i) => (
              item.href ? (
                <a key={i} href={item.href} style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, color: isDark ? '#cbd5e1' : '#475569',
                    fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#1e293b' : '#fff'; e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#cbd5e1' : '#475569'; }}>
                    {item.label}
                  </button>
                </a>
              ) : (
                <button key={i} onClick={item.onClick} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500, color: isDark ? '#cbd5e1' : '#475569',
                  fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#1e293b' : '#fff'; e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#cbd5e1' : '#475569'; }}>
                  {item.label}
                </button>
              )
            ))}
          </div>
          <ThemeToggle theme={theme} toggle={toggleTheme}/>
          <motion.button onClick={onGetStarted} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${accent}, #10b981)`, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            Try it free →
          </motion.button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(60px, 10vw, 120px) 40px', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100,
            background: isDark ? '#0d1e35' : '#eff6ff', border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`,
            fontSize: 12, color: accent, fontWeight: 600, marginBottom: 28, letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>
          MULTI-AGENT SIGNAL INTELLIGENCE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(38px, 7vw, 80px)', fontWeight: 400, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Cut through the noise.<br/>
          <span style={{ background: `linear-gradient(135deg, ${accent}, #10b981)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Find what's <em>real.</em>
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ fontSize: 18, color: muted, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 40px' }}>
          Three specialized AI agents search the live web, find contradictions, and repair broken information — in under 3 seconds.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <motion.button onClick={onGetStarted} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '14px 32px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${accent}, #10b981)`, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
            Try Signal.repair free
          </motion.button>
          <a href="#how-it-works">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '14px 32px', borderRadius: 100, border: `1px solid ${border}`, cursor: 'pointer', background: 'transparent', color: text, fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>
              See how it works
            </motion.button>
          </a>
        </motion.div>

        {/* Live demo */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 28, maxWidth: 600, margin: '0 auto',
            boxShadow: isDark ? '0 0 60px rgba(59,130,246,0.06)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }}/>
            LIVE ANALYSIS
          </div>
          {DEMO_ITEMS.map((item, i) => (
            <motion.div key={i} animate={{ opacity: activeClaim === i ? 1 : isDark ? 0.35 : 0.4, scale: activeClaim === i ? 1 : 0.98 }} transition={{ duration: 0.3 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10,
                background: activeClaim === i ? (isDark ? '#0a0f1e' : '#f8fafc') : 'transparent',
                border: `1px solid ${activeClaim === i ? border : 'transparent'}`,
                marginBottom: 6, borderLeft: activeClaim === i ? `3px solid ${item.color}` : `3px solid transparent` }}>
              <span style={{ fontSize: 13, color: text }}>{item.claim}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: item.color,
                  background: `${item.color}18`, padding: '2px 8px', borderRadius: 100 }}>{item.verdict}</span>
                <span style={{ fontSize: 14 }}>{item.emoji}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: '60px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, textAlign: 'center' }}>
          {[
            { val: "3", label: "Specialized Agents" },
            { val: "50+", label: "Sources Checked" },
            { val: "<3s", label: "Average Response" },
            { val: "6", label: "Verdict Levels" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 52, color: accent, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginTop: 6 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 14 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.02em' }}>
              Three agents. <em>One verdict.</em>
            </h2>
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                style={{ display: 'flex', gap: 24, padding: 28, background: card, border: `1px solid ${border}`, borderRadius: 16, borderLeft: `4px solid ${step.color}`,
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, color: step.color, opacity: 0.25, flexShrink: 0, lineHeight: 1, marginTop: -4 }}>{step.num}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: step.color }}>{HOW_ICONS[step.icon]}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: step.color }}>{step.title}</span>
                  </div>
                  <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 40px', background: isDark ? '#080e1e' : '#f1f5f9', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 14 }}>FEATURES</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 400, letterSpacing: '-0.02em' }}>
              Everything you need to<br/><em>trust information again</em>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ padding: 24, borderRadius: 16, background: card, border: `1px solid ${border}`, cursor: 'default', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}66`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = border)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? '#1e293b' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accent, marginBottom: 14, border: `1px solid ${border}` }}>
                {FEATURE_ICONS[f.icon]}
              </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: text }}>{f.title}</div>
                <p style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginBottom: 14 }}> PUBLIC API</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 400, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Integrate signal intelligence <em>into anything</em>
            </h2>
            <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7, marginBottom: 24 }}>One endpoint. Any claim. Returns a structured verdict your app can act on immediately.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Verify claims before publishing', 'Check AI outputs for hallucinations', 'Monitor topics for signal drift', 'Build trust layers into any product'].map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: text }}>{item}</div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: isDark ? '#060c1a' : '#0f172a', borderRadius: 16, padding: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            <div style={{ color: '#64748b', marginBottom: 4 }}>// POST /repair</div>
            <div style={{ color: '#94a3b8' }}>{`{`}</div>
            <div style={{ paddingLeft: 16, color: '#10b981' }}>"input": "your claim here",</div>
            <div style={{ paddingLeft: 16, color: '#10b981', marginBottom: 4 }}>"mode": "claim"</div>
            <div style={{ color: '#94a3b8', marginBottom: 16 }}>{`}`}</div>
            <div style={{ color: '#64748b', marginBottom: 4 }}>// Response</div>
            <div style={{ color: '#94a3b8' }}>{`{`}</div>
            <div style={{ paddingLeft: 16, color: '#f59e0b' }}>"verdict": "FALSE",</div>
            <div style={{ paddingLeft: 16, color: '#f59e0b' }}>"signal_score": 10,</div>
            <div style={{ paddingLeft: 16, color: '#f59e0b' }}>"consensus_confidence": "UNANIMOUS",</div>
            <div style={{ paddingLeft: 16, color: '#f59e0b' }}>"repair": "The corrected claim...",</div>
            <div style={{ paddingLeft: 16, color: '#f59e0b' }}>"sources": [...]</div>
            <div style={{ color: '#94a3b8' }}>{`}`}</div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 40px', textAlign: 'center', borderTop: `1px solid ${border}` }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Stop guessing.<br/>
            <span style={{ background: `linear-gradient(135deg, ${accent}, #10b981)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <em>Start repairing.</em>
            </span>
          </h2>
          <p style={{ fontSize: 16, color: muted, marginBottom: 40 }}>Free to use. No account required. Just paste and repair.</p>
          <motion.button onClick={onGetStarted} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '16px 40px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${accent}, #10b981)`, color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 8px 40px rgba(59,130,246,0.3)' }}>
            Try Signal.repair free
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 40px', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: text }}>signal<span style={{ color: accent }}>.</span>repair</span>
        <span style={{ fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>DEVELOPERWEEK NYC 2026</span>
        <span style={{ fontSize: 12, color: muted }}>Powered by Groq · Tavily · Tower</span>
      </footer>
    </div>
  );
}