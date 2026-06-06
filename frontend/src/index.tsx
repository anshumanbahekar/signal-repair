import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Landing from './Landing';
import History from './History';
import URLAnalyzer from './URLAnalyzer';
import ClaimBattle from './ClaimBattle';
import TrendRadar from './TrendRadar';
import DNAofLie from './DNAofLie';

type Theme = 'dark' | 'light';
type Page = 'landing' | 'app' | 'history' | 'url' | 'battle' | 'radar' | 'dna';

function Root() {
  const [page, setPage] = useState<Page>('landing');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('signal-theme') as Theme) || 'dark';
    } catch { return 'dark'; }
  });
  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('signal-theme', next); } catch {}
    return next;
  });

  if (page === 'app') return <App onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'history') return <History onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'url') return <URLAnalyzer onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'battle') return <ClaimBattle onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'radar') return <TrendRadar onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'dna') return <DNAofLie onBack={() => setPage('landing')} theme={theme} toggleTheme={toggleTheme} />;
  return (
    <Landing
      onGetStarted={() => setPage('app')}
      onHistory={() => setPage('history')}
      onURLAnalyzer={() => setPage('url')}
      onBattle={() => setPage('battle')}
      onRadar={() => setPage('radar')}
      onDNA={() => setPage('dna')}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Root /></React.StrictMode>);