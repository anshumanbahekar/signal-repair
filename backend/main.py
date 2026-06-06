from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import uuid, os, json, asyncio

load_dotenv()

from models import RepairRequest, RepairResult, WatchRequest, WatchResult
from agents.scout import scout
from agents.critic import critic
from agents.synthesis import synthesize
from history import save_repair, load_history, get_stats
from agents.url_analyzer import analyze_url
from agents.battle import battle as run_battle
from agents.trend_radar import get_trend_radar
from agents.dna import build_dna

app = FastAPI(title="Signal.repair API", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

watches = {}

@app.get("/")
async def root():
    return {"name": "Signal.repair", "tagline": "Cut through noise. Find what's real.", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "agents": ["scout", "critic", "synthesis"]}

@app.get("/history")
async def get_history(limit: int = 50):
    records = load_history(limit)
    stats = get_stats(records)
    return {"records": records, "stats": stats}

async def run_pipeline_stream(request: RepairRequest):
    def event(type: str, data: dict):
        return f"data: {json.dumps({'type': type, **data})}\n\n"

    yield event("start", {"message": f"🚀 Pipeline started for mode: {request.mode}"})
    await asyncio.sleep(0.1)

    yield event("agent", {"agent": "scout", "status": "running", "message": "🔍 Scout searching live web via Tavily..."})
    sources, scout_trace = await scout(request.input, request.mode)
    for t in scout_trace[1:]:
        yield event("trace", {"message": t}); await asyncio.sleep(0.05)
    yield event("agent", {"agent": "scout", "status": "done", "message": f"✅ Scout found {len(sources)} live sources", "source_count": len(sources)})
    yield event("sources", {"sources": [s.model_dump() for s in sources]})
    await asyncio.sleep(0.2)

    yield event("agent", {"agent": "critic", "status": "running", "message": "🧐 Critic analyzing sources for contradictions..."})
    sources, contradictions, critic_trace = await critic(request.input, sources)
    for t in critic_trace[1:]:
        yield event("trace", {"message": t}); await asyncio.sleep(0.05)
    yield event("agent", {"agent": "critic", "status": "done", "message": f"✅ Critic found {len(contradictions)} contradictions"})
    yield event("contradictions", {"contradictions": [c.model_dump() for c in contradictions]})
    await asyncio.sleep(0.2)

    yield event("agent", {"agent": "synthesis", "status": "running", "message": "🧠 Synthesis running Consensus Engine (3 models in parallel)..."})
    result, synthesis_trace = await synthesize(request.input, sources, contradictions, request.mode)
    for t in synthesis_trace[1:]:
        yield event("trace", {"message": t}); await asyncio.sleep(0.05)
    yield event("agent", {"agent": "synthesis", "status": "done", "message": f"✅ Verdict: {result.verdict} | Score: {result.signal_score}/100"})

    # Save to history
    save_repair(result)

    yield event("result", {"result": result.model_dump()})
    yield event("done", {"message": "Pipeline complete"})

@app.post("/repair/stream")
async def repair_stream(request: RepairRequest):
    if not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    return StreamingResponse(run_pipeline_stream(request), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.post("/repair", response_model=RepairResult)
async def repair(request: RepairRequest):
    if not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    all_trace = [f"🚀 Signal.repair pipeline started for mode: {request.mode}"]
    sources, scout_trace = await scout(request.input, request.mode)
    all_trace.extend(scout_trace)
    sources, contradictions, critic_trace = await critic(request.input, sources)
    all_trace.extend(critic_trace)
    result, synthesis_trace = await synthesize(request.input, sources, contradictions, request.mode)
    all_trace.extend(synthesis_trace)
    result.agent_trace = all_trace
    save_repair(result)
    return result





@app.post("/dna")
async def dna_endpoint(request: dict):
    """
    DNA of a Lie: Build a visual timeline showing how a false claim
    originated, spread, was challenged, and debunked.
    """
    claim = request.get("claim", "").strip()
    if not claim:
        raise HTTPException(status_code=400, detail="Claim cannot be empty")
    result = await build_dna(claim)
    return result

@app.get("/radar")
async def trend_radar(limit: int = 12):
    """
    Trend Radar: Analyze trending global topics in real time.
    Returns sorted by most disputed first.
    """
    result = await get_trend_radar(limit)
    return result

@app.post("/battle")
async def battle_endpoint(request: dict):
    """
    Claim Battle Mode: Two claims enter, one wins.
    Runs both through full pipeline in parallel and declares a winner.
    """
    claim_a = request.get("claim_a", "").strip()
    claim_b = request.get("claim_b", "").strip()
    if not claim_a or not claim_b:
        raise HTTPException(status_code=400, detail="Both claims are required")
    result = await run_battle(claim_a, claim_b)
    return result

@app.post("/analyze/url")
async def analyze_url_endpoint(request: dict):
    """
    URL Analyzer: Fetch any article, extract claims, verify each one.
    Returns overall credibility score + per-claim verdicts.
    """
    url = request.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    if not url.startswith("http"):
        url = "https://" + url
    result = await analyze_url(url)
    return result

@app.post("/watch", response_model=WatchResult)
async def create_watch(request: WatchRequest):
    watch_id = str(uuid.uuid4())[:8]
    watches[watch_id] = {"topic": request.topic, "frequency": request.frequency, "email": request.email, "status": "active"}
    return WatchResult(watch_id=watch_id, topic=request.topic, status="active",
        message=f"Signal Watch created. Monitoring '{request.topic}' {request.frequency}. ID: {watch_id}")

@app.get("/watches")
async def list_watches():
    return {"watches": watches, "count": len(watches)}