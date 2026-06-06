# 🔨 Signal.repair

> **Cut through the noise. Find what's real.**

AI-powered multi-agent signal intelligence platform that verifies any claim, topic, URL, or AI-generated text using live web data and a 3-model consensus engine.

Built for **DeveloperWeek New York 2026 Hackathon**

---

## 🌐 What it does

Paste any claim, URL, or AI-generated text. Three specialized agents work in parallel to find the truth:

1. **Scout Agent** — searches 50+ live sources via Tavily's real-time web intelligence
2. **Critic Agent** — scores credibility, assigns stances, finds contradictions between sources
3. **Consensus Engine** — runs 3 LLMs in parallel (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B). Majority wins. All agree = UNANIMOUS. All disagree = DISPUTED.

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

---

## 🏗 Architecture

```
User Input
    ↓
Scout Agent (Tavily live web search)
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
- Tavily API (live web search)
- Groq (Llama 3.3 70B, Llama 3.1 8B, Gemma 2 9B)
- Tower (serverless pipeline + lakehouse)

**Frontend**
- React + TypeScript
- Framer Motion (animations)
- Canvas API (EKG meter + source graph)
- Dark/light theme

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

---

## 📡 API

```bash
# Repair a claim
POST http://localhost:8080/repair
{"input": "The Great Wall of China is visible from space", "mode": "claim"}

# Analyze a URL
POST http://localhost:8080/analyze/url
{"url": "https://example.com/article"}

# Claim Battle
POST http://localhost:8080/battle
{"claim_a": "Coffee is good for you", "claim_b": "Coffee is bad for you"}

# DNA of a Lie
POST http://localhost:8080/dna
{"claim": "Einstein failed math in school"}

# Trend Radar
GET http://localhost:8080/radar

# Signal History
GET http://localhost:8080/history
```

Full API docs: http://localhost:8080/docs

---

## 🏆 Hackathon Challenges

- DeveloperWeek New York 2026 — Overall Winner
- Tower Pipeline Challenge: Data-to-AI
- Nimble — Build an Agentic App That Sees the Live Web
- name.com — Domain Roulette (domain: **signal.repair**)

---

##  Made with ❤️🚀 — DeveloperWeek NYC 2026
