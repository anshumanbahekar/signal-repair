import os
import json
import asyncio
from groq import Groq
from agents.scout import scout
from agents.synthesis import synthesize
from agents.critic import critic
import datetime

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

TRENDING_TOPICS = [
    {"topic": "AI regulation and safety laws", "category": "Technology"},
    {"topic": "Climate change latest evidence", "category": "Science"},
    {"topic": "Nuclear fusion energy progress", "category": "Science"},
    {"topic": "Vaccine safety and effectiveness", "category": "Health"},
    {"topic": "Remote work productivity research", "category": "Business"},
    {"topic": "Bitcoin and cryptocurrency future", "category": "Finance"},
    {"topic": "Social media mental health effects", "category": "Health"},
    {"topic": "Electric vehicles replacing gas cars", "category": "Technology"},
    {"topic": "Universal basic income experiments", "category": "Economics"},
    {"topic": "Space exploration Mars mission", "category": "Science"},
    {"topic": "Ozempic weight loss drug safety", "category": "Health"},
    {"topic": "US China trade war impact", "category": "Politics"},
]

async def analyze_topic_quick(topic_data: dict) -> dict:
    """Quick analysis of a single trending topic."""
    topic = topic_data["topic"]
    try:
        sources, _ = await scout(topic, "topic")
        sources, contradictions, _ = await critic(topic, sources)
        result, _ = await synthesize(topic, sources, contradictions, "topic")
        return {
            "topic": topic,
            "category": topic_data["category"],
            "verdict": result.verdict,
            "signal_score": result.signal_score,
            "summary": result.summary[:120] + "..." if len(result.summary) > 120 else result.summary,
            "source_count": len(sources),
            "contradiction_count": len(contradictions),
            "consensus_confidence": result.consensus_confidence or "UNKNOWN",
            "analyzed_at": datetime.datetime.utcnow().isoformat(),
            "status": "analyzed"
        }
    except Exception as e:
        return {
            "topic": topic,
            "category": topic_data["category"],
            "verdict": "NOISE",
            "signal_score": 0,
            "summary": "Analysis failed.",
            "source_count": 0,
            "contradiction_count": 0,
            "consensus_confidence": "UNKNOWN",
            "analyzed_at": datetime.datetime.utcnow().isoformat(),
            "status": "error"
        }

async def get_trend_radar(limit: int = 12) -> dict:
    """
    Analyze all trending topics in parallel batches.
    Returns sorted by most disputed first.
    """
    topics = TRENDING_TOPICS[:limit]
    
    # Run in batches of 4 to avoid rate limits
    results = []
    batch_size = 4
    for i in range(0, len(topics), batch_size):
        batch = topics[i:i+batch_size]
        batch_results = await asyncio.gather(*[analyze_topic_quick(t) for t in batch])
        results.extend(batch_results)
        if i + batch_size < len(topics):
            await asyncio.sleep(1)

    # Sort: DISPUTED first, then by score ascending (most uncertain first)
    verdict_order = {"DISPUTED": 0, "NOISE": 1, "OUTDATED": 2, "FALSE": 3, "MOSTLY_TRUE": 4, "TRUE": 5}
    results.sort(key=lambda x: (verdict_order.get(x["verdict"], 3), x["signal_score"]))

    # Compute stats
    verdicts = [r["verdict"] for r in results]
    verdict_counts: dict = {}
    for v in verdicts:
        verdict_counts[v] = verdict_counts.get(v, 0) + 1

    most_disputed = [r for r in results if r["verdict"] == "DISPUTED"]
    avg_score = int(sum(r["signal_score"] for r in results) / len(results)) if results else 0

    return {
        "topics": results,
        "total": len(results),
        "avg_signal_score": avg_score,
        "verdict_counts": verdict_counts,
        "most_disputed_count": len(most_disputed),
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }