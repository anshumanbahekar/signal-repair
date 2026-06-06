import json
import os
from datetime import datetime
from models import RepairResult

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "data", "history.jsonl")

def save_repair(result: RepairResult):
    """Save a repair result to the history file."""
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    record = {
        "id": f"repair_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}",
        "timestamp": datetime.utcnow().isoformat(),
        "input": result.input,
        "verdict": result.verdict,
        "signal_score": result.signal_score,
        "summary": result.summary,
        "repair": result.repair,
        "source_count": len(result.sources),
        "contradiction_count": len(result.contradictions),
        "consensus_confidence": result.consensus_confidence or "UNKNOWN",
    }
    with open(HISTORY_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")
    return record

def load_history(limit: int = 50) -> list:
    """Load repair history from file."""
    if not os.path.exists(HISTORY_FILE):
        return []
    records = []
    with open(HISTORY_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except:
                    pass
    # Return most recent first
    return list(reversed(records[-limit:]))

def get_stats(records: list) -> dict:
    """Compute stats from history records."""
    if not records:
        return {
            "total": 0,
            "avg_score": 0,
            "verdict_counts": {},
            "confidence_counts": {},
        }
    scores = [r.get("signal_score", 0) for r in records]
    verdicts = [r.get("verdict", "NOISE") for r in records]
    confidences = [r.get("consensus_confidence", "UNKNOWN") for r in records]

    verdict_counts: dict = {}
    for v in verdicts:
        verdict_counts[v] = verdict_counts.get(v, 0) + 1

    confidence_counts: dict = {}
    for c in confidences:
        confidence_counts[c] = confidence_counts.get(c, 0) + 1

    return {
        "total": len(records),
        "avg_score": round(sum(scores) / len(scores), 1),
        "verdict_counts": verdict_counts,
        "confidence_counts": confidence_counts,
    }