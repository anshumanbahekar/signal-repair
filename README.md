# ⚡ Signal.repair

> **Cut through the noise. Find what's real.**

AI-powered multi-agent signal intelligence platform that verifies any claim, topic, URL, or AI-generated text using live web data and a 3-model consensus engine.

Built for **DeveloperWeek New York 2026 Hackathon**

## 🌐 Live Demo

- **App:** https://signal-repair.vercel.app
- **API:** https://signal-repair.onrender.com/docs
- **GitHub:** https://github.com/anshumanbahekar/signal-repair
- **Demo Video:** https://www.youtube.com/watch?v=RFKflqrorMA

> Note: Backend hosted on Render free tier — may take 30 seconds to wake up on first request.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Signal Repair** | Verify any claim with live sources + 3-model consensus |
| **URL Analyzer** | Paste any article URL, get per-claim credibility scores |
| **Claim Battle** | Two claims enter, one wins — evidence decides |
| **Trend Radar** | Real-time analysis of the world's most disputed topics |
| **DNA of a Lie** | Visual timeline of how misinformation originates and spreads |
| **Signal History** | All repairs stored in Tower lakehouse with analytics |
| **Live Streaming** | Watch agents work in real time via Server-Sent Events |
| **Source Graph** | Animated force graph showing source credibility network |
| **Browser Extension** | Right-click any text on any webpage to repair it |

---

## 🏗 Architecture

```
User Input
    ↓
Scout Agent (Nimble + Tavily live web search)
    ↓
Critic Agent (credibility scoring + contradiction detection)
    ↓
Consensus Engine (3 LLMs in parallel → majority vote)
    ↓
Signal Score (0-100) + Verdict + Repaired Claim
    ↓
Tower Lakehouse (storage + Signal Watch scheduling)
```

---

## 🛠 Tech Stack

**Backend**
- Python + FastAPI
- Server-Sent Events (real-time streaming)
- Nimble API (live web intelligence)
- Tavily API (fallback web search)
- Groq (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B)
- Tower (serverless pipeline + lakehouse)

**Frontend**
- React + TypeScript
- Framer Motion (animations)
- Canvas API (EKG meter + source graph)
- Dark/light theme

**Browser Extension**
- Chrome Manifest V3
- Context menu integration
- Real-time verdict popup

---

## 🚀 Running Locally

### Backend
```bash
cd backend
pip install fastapi uvicorn httpx anthropic python-dotenv pydantic aiohttp groq tavily-python newspaper4k trafilatura
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
NIMBLE_API_KEY=your_nimble_key
```

```bash
uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

### Browser Extension
1. Open Chrome → `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked → select `extension/` folder

---

## 📡 API

```bash
# Repair a claim
POST https://signal-repair.onrender.com/repair
{"input": "The Great Wall of China is visible from space", "mode": "claim"}

# Analyze a URL
POST https://signal-repair.onrender.com/analyze/url
{"url": "https://example.com/article"}

# Claim Battle
POST https://signal-repair.onrender.com/battle
{"claim_a": "Coffee is good for you", "claim_b": "Coffee is bad for you"}

# DNA of a Lie
POST https://signal-repair.onrender.com/dna
{"claim": "Einstein failed math in school"}

# Trend Radar
GET https://signal-repair.onrender.com/radar

# Signal History
GET https://signal-repair.onrender.com/history
```

Full API docs: https://signal-repair.onrender.com/docs

---

## 🏆 Hackathon Challenges

- DeveloperWeek New York 2026 — Overall Winner
- Tower Pipeline Challenge: Data-to-AI
- Nimble — Build an Agentic App That Sees the Live Web
- name.com — Domain Roulette (domain: **signal.repair**)

---

##  Made with ❤️🚀 — DeveloperWeek NYC 2026
