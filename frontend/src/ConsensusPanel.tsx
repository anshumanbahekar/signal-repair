import React from 'react';
import { motion } from 'framer-motion';

interface IndividualVerdict {
  persona: string;
  model: string;
  verdict: string;
  score: number;
}

interface ConsensusPanelProps {
  confidence: string;
  verdicts: IndividualVerdict[];
  theme: 'dark' | 'light';
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#16a34a',
  MOSTLY_TRUE: '#65a30d',
  DISPUTED: '#d97706',
  OUTDATED: '#ea580c',
  FALSE: '#dc2626',
  NOISE: '#6b7280',
};

const PERSONA_ICONS: Record<string, string> = {
  skeptic: 'S',
  analyst: 'A',
  researcher: 'R',
};

const CONFIDENCE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  UNANIMOUS: { emoji: '●', color: '#16a34a', label: 'Unanimous — All models agree' },
  HIGH:      { emoji: '●', color: '#d97706', label: 'High confidence — 2/3 agree' },
  LOW:       { emoji: '●', color: '#dc2626', label: 'Low confidence — Models disagree' },
};

export default function ConsensusPanel({ confidence, verdicts, theme }: ConsensusPanelProps) {
  const isDark = theme === 'dark';
  const card = isDark ? '#0d1526' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const config = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.LOW;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}>
          CONSENSUS ENGINE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100,
          background: `${config.color}18`, border: `1px solid ${config.color}44` }}>
          <span style={{ fontSize: 16, color: config.color, lineHeight: 1 }}>●</span>
          <span style={{ fontSize: 11, color: config.color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            {confidence}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {verdicts.map((v, i) => {
          const verdictColor = VERDICT_COLORS[v.verdict] || '#6b7280';
          const barWidth = `${v.score}%`;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                background: isDark ? '#0a0f1e' : '#f8fafc', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{PERSONA_ICONS[v.persona] || ''}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: text, textTransform: 'capitalize' }}>{v.persona}</span>
                    <span style={{ fontSize: 10, color: muted, marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>{v.model.split('-').slice(0,2).join('-')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: verdictColor,
                      background: `${verdictColor}18`, padding: '2px 8px', borderRadius: 100,
                      fontFamily: "'JetBrains Mono', monospace" }}>
                      {v.verdict}
                    </span>
                    <span style={{ fontSize: 11, color: muted, fontFamily: "'JetBrains Mono', monospace" }}>{v.score}/100</span>
                  </div>
                </div>
                <div style={{ height: 4, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: barWidth }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: verdictColor, borderRadius: 2 }}/>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: muted, textAlign: 'center', fontStyle: 'italic' }}>
        {config.label}
      </div>
    </motion.div>
  );
}