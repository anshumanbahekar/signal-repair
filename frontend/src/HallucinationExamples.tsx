import React from 'react';
import { motion } from 'framer-motion';

interface Example {
  label: string;
  text: string;
  tag: string;
}

const EXAMPLES: Example[] = [
  {
    label: "Einstein failed math",
    tag: "Famous Myth",
    text: "Albert Einstein failed mathematics in school and was considered a poor student by his teachers."
  },
  {
    label: "Napoleon was short",
    tag: "Historical Myth",
    text: "Napoleon Bonaparte was extremely short, standing at only 5 feet 2 inches tall, which is why he had a complex about his height."
  },
  {
    label: "We only use 10% of brain",
    tag: "Science Myth",
    text: "Humans only use about 10% of their brain capacity. The other 90% remains unused and dormant most of the time."
  },
  {
    label: "Great Wall from space",
    tag: "Popular Myth",
    text: "The Great Wall of China is the only man-made structure visible from space with the naked eye."
  },
  {
    label: "Goldfish 3-second memory",
    tag: "Animal Myth",
    text: "Goldfish have a memory span of only 3 seconds and cannot remember anything for longer than that."
  },
];

interface Props {
  onSelect: (text: string) => void;
  theme: 'dark' | 'light';
}

export default function HallucinationExamples({ onSelect, theme }: Props) {
  const isDark = theme === 'dark';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#475569' : '#94a3b8';
  const bg = isDark ? '#0a0f1e' : '#f8fafc';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>
        FAMOUS HALLUCINATIONS — click to demolish
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {EXAMPLES.map((ex, i) => (
          <motion.button key={i} onClick={() => onSelect(ex.text)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${border}`,
              background: bg, cursor: 'pointer', fontSize: 11, color: text,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = text; }}>
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#dc262618', color: '#dc2626', fontWeight: 700 }}>{ex.tag}</span>
            {ex.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}