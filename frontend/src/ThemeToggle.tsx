import React from 'react';
import { motion } from 'framer-motion';

type Theme = 'dark' | 'light';

export default function ThemeToggle({ theme, toggle }: { theme: Theme; toggle: () => void }) {
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggle}
      style={{
        width: 52, height: 28, borderRadius: 14,
        background: isDark ? '#1e293b' : '#e2e8f0',
        border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
        cursor: 'pointer', position: 'relative', padding: 0,
        display: 'flex', alignItems: 'center',
        transition: 'background 0.3s, border-color 0.3s',
        flexShrink: 0,
      }}
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <span style={{ position: 'absolute', left: 6, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isDark ? 0.3 : 1, transition: 'opacity 0.3s' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#94a3b8' : '#f59e0b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </span>
      <span style={{ position: 'absolute', right: 6, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isDark ? 1 : 0.3, transition: 'opacity 0.3s' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>
      {/* Sliding knob */}
      <motion.div
        animate={{ x: isDark ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: isDark ? '#3b82f6' : '#fff',
          boxShadow: isDark ? '0 0 8px rgba(59,130,246,0.5)' : '0 1px 4px rgba(0,0,0,0.15)',
          position: 'absolute', left: 0,
        }}
      />
    </motion.button>
  );
}