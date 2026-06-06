"""
Signal.repair — Tower Pipeline
================================
This pipeline runs on Tower's serverless compute and:
1. Fetches live web data via DuckDuckGo (or Nimble when key is available)
2. Runs the multi-agent repair pipeline
3. Stores results in Tower's Iceberg lakehouse
4. Schedules recurring Signal Watch jobs

Deploy with: tower deploy
Run with:    tower run signal_pipeline.py
"""

import os
import json
import httpx
import datetime
from groq import Groq

# Tower lakehouse storage (Iceberg-compatible)
try:
    import tower
    TOWER_AVAILABLE = True
except ImportError:
    TOWER_AVAILABLE = False
    print("Tower not installed — running in local mode")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# ─────────────────────────────────────────────
# STEP 1: SCOUT — Fetch live web data
# ─────────────────────────────────────────────
def scout(query: str) -> list[dict]:
    """Fetch live sources using Tavily API."""
    print(f"🔍 Scout: searching for '{query}'")
    sources = []
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    try:
        if tavily_key:
            response = httpx.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_key,
                    "query": f"fact check verify: {query}",
                    "search_depth": "basic",
                    "max_results": 5
                },
                timeout=20
            )
            if response.status_code == 200:
                data = response.json()
                for r in data.get("results", []):
                    sources.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("content", "")[:300],
                        "credibility": 0.75,
                        "fetched_at": datetime.datetime.utcnow().isoformat()
                    })
    except Exception as e:
        print(f"⚠️ Scout error: {e}")
    print(f"✅ Scout found {len(sources)} sources")
    return sources


# ─────────────────────────────────────────────
# STEP 2: ANALYZE — Run Groq LLM analysis
# ─────────────────────────────────────────────
def analyze(query: str, sources: list[dict]) -> dict:
    """Run Groq analysis on the query and sources."""
    print(f"🧠 Analyzing: '{query}'")
    client = Groq(api_key=GROQ_API_KEY)

    sources_text = "\n".join([
        f"- {s['title']}: {s['snippet'][:150]}"
        for s in sources[:5]
    ]) if sources else "No external sources available."

    prompt = f"""Analyze this claim/topic and return ONLY JSON:

QUERY: {query}
SOURCES: {sources_text}

Return:
{{
  "verdict": "TRUE|MOSTLY_TRUE|DISPUTED|OUTDATED|FALSE|NOISE",
  "signal_score": <0-100>,
  "summary": "<2-3 sentences>",
  "repair": "<corrected version>"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"⚠️ Analysis error: {e}")
        return {"verdict": "NOISE", "signal_score": 0, "summary": "Analysis failed.", "repair": ""}


# ─────────────────────────────────────────────
# STEP 3: STORE — Save to Tower lakehouse
# ─────────────────────────────────────────────
def store(query: str, sources: list[dict], analysis: dict) -> dict:
    """Store pipeline results in Tower's Iceberg lakehouse."""
    record = {
        "id": f"signal_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "query": query,
        "verdict": analysis.get("verdict", "NOISE"),
        "signal_score": analysis.get("signal_score", 0),
        "summary": analysis.get("summary", ""),
        "repair": analysis.get("repair", ""),
        "source_count": len(sources),
        "sources": json.dumps(sources),
        "processed_at": datetime.datetime.utcnow().isoformat(),
        "pipeline_version": "1.0.0"
    }

    if TOWER_AVAILABLE:
        try:
            # Write to Tower Iceberg lakehouse
            tower.write_table("signal_repairs", [record])
            print(f"✅ Stored to Tower lakehouse: {record['id']}")
        except Exception as e:
            print(f"⚠️ Tower storage error: {e} — saving locally")
            _save_local(record)
    else:
        _save_local(record)

    return record


def _save_local(record: dict):
    """Fallback: save to local JSONL file."""
    os.makedirs("data", exist_ok=True)
    with open("data/signal_repairs.jsonl", "a") as f:
        f.write(json.dumps(record) + "\n")
    print(f"💾 Saved locally: data/signal_repairs.jsonl")


# ─────────────────────────────────────────────
# MAIN PIPELINE — runs on Tower scheduler
# ─────────────────────────────────────────────
def run_pipeline(query: str) -> dict:
    """
    Full Signal.repair pipeline:
    Scout → Analyze → Store
    """
    print(f"\n{'='*50}")
    print(f"🚀 Signal.repair Pipeline starting")
    print(f"   Query: {query}")
    print(f"   Time:  {datetime.datetime.utcnow().isoformat()}")
    print(f"{'='*50}")

    # Step 1: Scout
    sources = scout(query)

    # Step 2: Analyze
    analysis = analyze(query, sources)
    print(f"📊 Verdict: {analysis.get('verdict')} | Score: {analysis.get('signal_score')}/100")

    # Step 3: Store
    record = store(query, sources, analysis)

    print(f"\n✅ Pipeline complete: {record['id']}")
    print(f"   Verdict: {record['verdict']}")
    print(f"   Signal Score: {record['signal_score']}/100")
    print(f"   Summary: {record['summary'][:100]}...")
    return record


# ─────────────────────────────────────────────
# SIGNAL WATCH — scheduled monitoring
# ─────────────────────────────────────────────
WATCH_TOPICS = [
    "AI regulation news",
    "climate change latest research",
    "cryptocurrency market status",
]

def run_watch_pipeline():
    """
    Scheduled job: Monitor all Signal Watch topics.
    Tower runs this on a daily schedule.
    """
    print(f"\n🕐 Signal Watch Pipeline — {datetime.datetime.utcnow().isoformat()}")
    results = []
    for topic in WATCH_TOPICS:
        result = run_pipeline(topic)
        results.append(result)
    print(f"\n✅ Watch pipeline complete — processed {len(results)} topics")
    return results


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # Run with a specific query: python signal_pipeline.py "my claim here"
        query = " ".join(sys.argv[1:])
        result = run_pipeline(query)
    else:
        # Run the watch pipeline (default)
        run_watch_pipeline()