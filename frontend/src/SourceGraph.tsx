import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Source {
  url: string;
  title: string;
  snippet: string;
  credibility_score: number;
  stance: string;
}

interface Contradiction {
  source_a: string;
  source_b: string;
  description: string;
}

interface Props {
  sources: Source[];
  contradictions: Contradiction[];
  theme: 'dark' | 'light';
}

const STANCE_COLORS: Record<string, string> = {
  supports: '#16a34a',
  contradicts: '#dc2626',
  neutral: '#6b7280',
};

export default function SourceGraph({ sources, contradictions, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!sources.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Space nodes further apart in a larger circle
    const radius = Math.min(W, H) * 0.36;
    const nodes = sources.map((s, i) => {
      const angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0, vy: 0,
        source: s,
        r: 10 + s.credibility_score * 16,
        color: STANCE_COLORS[s.stance] || '#6b7280',
        // Truncate labels more aggressively
        label: s.title.length > 14 ? s.title.slice(0, 14) + '…' : s.title,
        pulse: i * 0.4,
        angle,
      };
    });

    // Build edges
    const edges: { a: number; b: number }[] = [];
    contradictions.forEach(c => {
      const ai = sources.findIndex(s => s.title.slice(0,12) === c.source_a.slice(0,12));
      const bi = sources.findIndex(s => s.title.slice(0,12) === c.source_b.slice(0,12));
      if (ai >= 0 && bi >= 0 && ai !== bi) edges.push({ a: ai, b: bi });
    });

    let frame = 0;

    const simulate = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = nodes[i].r + nodes[j].r + 60;
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.04;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
        nodes[i].vx += (cx - nodes[i].x) * 0.003;
        nodes[i].vy += (cy - nodes[i].y) * 0.003;
        nodes[i].vx *= 0.88;
        nodes[i].vy *= 0.88;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;
        // Keep within bounds with padding for labels
        nodes[i].x = Math.max(nodes[i].r + 80, Math.min(W - nodes[i].r - 80, nodes[i].x));
        nodes[i].y = Math.max(nodes[i].r + 40, Math.min(H - nodes[i].r - 40, nodes[i].y));
        nodes[i].pulse += 0.04;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isDark ? '#060c1a' : '#f8fafc';
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = isDark ? '#1e293b33' : '#e2e8f033';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Draw contradiction edges
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf2455';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Mid-point warning icon
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', mx, my);
      });

      // Draw nodes
      nodes.forEach(node => {
        const pulseR = node.r + Math.sin(node.pulse) * 1.5;

        // Glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseR * 2.5);
        grad.addColorStop(0, node.color + '33');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = node.color + 'bb';
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Score inside node
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(10, Math.floor(pulseR * 0.55))}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(node.source.credibility_score * 100)}%`, node.x, node.y);

        // Label OUTSIDE node — pushed away from center
        const labelDist = pulseR + 22;
        const lx = node.x + Math.cos(node.angle) * labelDist;
        const ly = node.y + Math.sin(node.angle) * labelDist;

        // Label background pill
        ctx.font = '10px DM Sans, sans-serif';
        const textW = ctx.measureText(node.label).width;
        const pad = 5;
        ctx.fillStyle = isDark ? '#0d1526dd' : '#ffffffdd';
        ctx.beginPath();
        ctx.roundRect(lx - textW/2 - pad, ly - 8, textW + pad*2, 16, 4);
        ctx.fill();
        ctx.strokeStyle = node.color + '66';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#e2e8f0' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, lx, ly);
      });

      frame++;
    };

    const loop = () => {
      if (frame < 80) simulate();
      else {
        nodes.forEach(n => { n.pulse += 0.03; });
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animRef.current);
  }, [sources, contradictions, theme]);

  if (!sources.length) return null;

  const border = isDark ? '#1e293b' : '#e2e8f0';
  const muted = isDark ? '#475569' : '#94a3b8';

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{ borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 10, color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}>
          🌐 SOURCE CREDIBILITY NETWORK
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: muted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}/> supports</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}/> contradicts</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280', display: 'inline-block' }}/> neutral</span>
          <span style={{ color: '#fbbf24' }}>⚡ contradiction</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={800} height={420}
        style={{ width: '100%', height: 'auto', display: 'block' }}/>
    </motion.div>
  );
}