const API = 'https://signal-repair-production.up.railway.app';

const VERDICT_COLORS = {
  TRUE:        { color: '#16a34a', bg: '#dcfce722', border: '#16a34a44' },
  MOSTLY_TRUE: { color: '#65a30d', bg: '#ecfccb22', border: '#65a30d44' },
  DISPUTED:    { color: '#d97706', bg: '#fef3c722', border: '#d97706 44' },
  OUTDATED:    { color: '#ea580c', bg: '#ffedd522', border: '#ea580c44' },
  FALSE:       { color: '#dc2626', bg: '#fee2e222', border: '#dc262644' },
  NOISE:       { color: '#6b7280', bg: '#f3f4f622', border: '#6b728044' },
};

const claimInput = document.getElementById('claimInput');
const repairBtn = document.getElementById('repairBtn');
const loadingEl = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const resultEl = document.getElementById('result');
const errorEl = document.getElementById('error');

const LOADING_STEPS = [
  'Searching live web...',
  'Analyzing sources...',
  'Running consensus engine...',
];

let stepIdx = 0;
let stepInterval = null;

// Load selected text from page
chrome.storage.local.get(['pendingClaim', 'selectedText'], (data) => {
  const claim = data.pendingClaim || data.selectedText || '';
  if (claim) {
    claimInput.value = claim;
    chrome.storage.local.remove(['pendingClaim', 'selectedText']);
  }
});

repairBtn.addEventListener('click', async () => {
  const claim = claimInput.value.trim();
  if (!claim) return;

  // Show loading
  loadingEl.style.display = 'block';
  resultEl.style.display = 'none';
  errorEl.style.display = 'none';
  repairBtn.disabled = true;
  stepIdx = 0;
  loadingText.textContent = LOADING_STEPS[0];

  stepInterval = setInterval(() => {
    stepIdx = Math.min(stepIdx + 1, LOADING_STEPS.length - 1);
    loadingText.textContent = LOADING_STEPS[stepIdx];
  }, 2000);

  try {
    const response = await fetch(`${API}/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: claim, mode: 'claim' })
    });

    if (!response.ok) throw new Error('Backend error');
    const data = await response.json();

    clearInterval(stepInterval);
    loadingEl.style.display = 'none';
    showResult(data);

  } catch (e) {
    clearInterval(stepInterval);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = 'Cannot connect to Signal.repair backend. Make sure it is running on port 8080.';
  } finally {
    repairBtn.disabled = false;
  }
});

function drawEKG(canvas, score, color) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, W, H);

  const amplitude = (score / 100) * (H * 0.35);
  const baseline = H * 0.6;
  const segW = 60;
  const segs = Math.ceil(W / segW) + 1;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < segs; i++) {
    const x = i * segW;
    if (score < 15) {
      ctx.moveTo(x, baseline + (Math.random() * 3 - 1.5));
      ctx.lineTo(x + segW, baseline + (Math.random() * 3 - 1.5));
    } else {
      ctx.moveTo(x, baseline);
      ctx.lineTo(x + segW * 0.3, baseline);
      ctx.lineTo(x + segW * 0.4, baseline - amplitude);
      ctx.lineTo(x + segW * 0.5, baseline + amplitude * 0.4);
      ctx.lineTo(x + segW * 0.55, baseline);
      ctx.lineTo(x + segW, baseline);
    }
  }
  ctx.stroke();
}

function showResult(data) {
  const config = VERDICT_COLORS[data.verdict] || VERDICT_COLORS.NOISE;
  resultEl.style.display = 'flex';

  resultEl.innerHTML = `
    <div class="verdict-card" style="background:${config.bg};border-color:${config.border}">
      <div class="verdict-label" style="color:${config.color}">${data.verdict}</div>
      <div class="score" style="color:${config.color}">${data.signal_score}</div>
      <div class="score-label">SIGNAL SCORE</div>
    </div>
    <canvas class="ekg" id="ekgCanvas" width="348" height="40"></canvas>
    <div class="summary-card">
      <div class="summary-label">SUMMARY</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    <div class="repair-card">
      <div class="repair-label">REPAIRED SIGNAL</div>
      <div class="repair-text">${data.repair}</div>
    </div>
    <button class="open-btn" id="openApp">Open in Signal.repair</button>
  `;

  // Draw EKG
  const canvas = document.getElementById('ekgCanvas');
  drawEKG(canvas, data.signal_score, config.color);

  // Open app button
  document.getElementById('openApp').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
}