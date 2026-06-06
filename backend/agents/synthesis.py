import os
import json
import asyncio
from groq import Groq
from typing import List
from models import Source, Contradiction, SignalVerdict, RepairResult, IndividualVerdict

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

PERSONAS = [
    {
        "name": "skeptic",
        "model": "llama-3.3-70b-versatile",
        "instruction": "You are a hard skeptic. Be critical and demand strong evidence before accepting any claim."
    },
    {
        "name": "analyst",
        "model": "llama-3.1-8b-instant",
        "instruction": "You are a neutral analyst. Weigh evidence objectively without bias."
    },
    {
        "name": "researcher",
        "model": "gemma2-9b-it",
        "instruction": "You are a careful researcher. Consider multiple interpretations and nuances."
    },
]

async def call_single_model(persona: dict, query: str, sources_summary: str, contradictions_summary: str, mode_instruction: str) -> dict:
    """Call a single model with a specific persona."""
    prompt = f"""{persona['instruction']}

You are part of Signal.repair's Consensus Engine — an AI system that repairs broken information signals.

INPUT: {query}
MODE: {mode_instruction}

SOURCES:
{sources_summary}

CONTRADICTIONS:
{contradictions_summary}

Return ONLY a JSON object, no other text:
{{
  "verdict": "TRUE|MOSTLY_TRUE|DISPUTED|OUTDATED|FALSE|NOISE",
  "signal_score": <integer 0-100>,
  "summary": "<2-3 sentence plain English summary>",
  "what_is_accurate": "<what part is accurate>",
  "what_is_noise": "<what part is misleading, false, or outdated>",
  "what_changed": "<if outdated, what changed — otherwise null>",
  "repair": "<the corrected, accurate version in 1-2 sentences>"
}}

Signal score: 85-100=verified, 60-84=mostly true, 40-59=disputed, 20-39=mostly false, 0-19=noise"""

    try:
        response = get_client().chat.completions.create(
            model=persona["model"],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=800
        )
        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        data["persona"] = persona["name"]
        data["model"] = persona["model"]
        return data
    except Exception as e:
        return {
            "verdict": "NOISE",
            "signal_score": 0,
            "summary": f"Analysis failed: {str(e)}",
            "what_is_accurate": "Unknown",
            "what_is_noise": "Unknown",
            "what_changed": None,
            "repair": "Please try again.",
            "persona": persona["name"],
            "model": persona["model"],
            "error": str(e)
        }


def compute_consensus(results: list[dict]) -> dict:
    """
    Compute consensus from multiple model verdicts.
    Returns the winning verdict, confidence level, and averaged score.
    """
    verdicts = [r.get("verdict", "NOISE") for r in results]
    scores = [int(r.get("signal_score", 0)) for r in results]

    # Count verdict occurrences
    verdict_counts: dict = {}
    for v in verdicts:
        verdict_counts[v] = verdict_counts.get(v, 0) + 1

    # Find majority verdict
    winning_verdict = max(verdict_counts, key=verdict_counts.get)
    max_count = verdict_counts[winning_verdict]
    total = len(results)

    # Determine confidence
    if max_count == total:
        confidence = "UNANIMOUS"
        confidence_emoji = "🟢"
        score_boost = 8
    elif max_count >= total * 0.67:
        confidence = "HIGH"
        confidence_emoji = "🟡"
        score_boost = 3
    else:
        # All disagree — force DISPUTED
        winning_verdict = "DISPUTED"
        confidence = "LOW"
        confidence_emoji = "🔴"
        score_boost = -10

    # Average score with boost
    avg_score = int(sum(scores) / len(scores)) + score_boost
    avg_score = max(0, min(100, avg_score))

    # Find best summary (from the model that matches winning verdict)
    best_result = next((r for r in results if r.get("verdict") == winning_verdict), results[0])

    return {
        "verdict": winning_verdict,
        "signal_score": avg_score,
        "confidence": confidence,
        "confidence_emoji": confidence_emoji,
        "summary": best_result.get("summary", ""),
        "what_is_accurate": best_result.get("what_is_accurate", ""),
        "what_is_noise": best_result.get("what_is_noise", ""),
        "what_changed": best_result.get("what_changed"),
        "repair": best_result.get("repair", ""),
        "individual_verdicts": [
            {"persona": r["persona"], "model": r["model"], "verdict": r.get("verdict"), "score": r.get("signal_score")}
            for r in results
        ]
    }


async def synthesize(
    query: str,
    sources: List[Source],
    contradictions: List[Contradiction],
    mode: str = "claim"
) -> tuple[RepairResult, List[str]]:
    """
    Synthesis Agent with Consensus Engine:
    Runs 3 models in parallel, computes majority verdict.
    """
    trace = []
    trace.append("🧠 Synthesis Agent activated — launching Consensus Engine")

    sources_summary = "\n".join([
        f"- [{s.stance.upper()}] {s.title} (credibility: {s.credibility_score:.0%}): {s.snippet[:150]}"
        for s in sources[:6]
    ]) if sources else "No external sources — use training knowledge."

    contradictions_summary = "\n".join([
        f"- {c.source_a} vs {c.source_b}: {c.description}"
        for c in contradictions
    ]) if contradictions else "No contradictions found."

    mode_instruction = {
        "claim": "Analyze whether this claim is true, false, outdated, disputed, or noise.",
        "url": "Analyze the credibility and accuracy of content at this URL.",
        "topic": "Analyze the current state of information on this topic.",
        "hallucination": "Identify factual errors, hallucinations, or inaccuracies in this AI-generated text."
    }.get(mode, "Analyze this input.")

    trace.append(f"⚡ Running {len(PERSONAS)} models in parallel: {', '.join(p['model'] for p in PERSONAS)}")

    # Run all 3 models in parallel
    tasks = [
        call_single_model(persona, query, sources_summary, contradictions_summary, mode_instruction)
        for persona in PERSONAS
    ]
    results = await asyncio.gather(*tasks)

    # Log individual verdicts
    for r in results:
        trace.append(f"  [{r['persona'].upper()}] {r['model']}: {r.get('verdict')} ({r.get('signal_score')}/100)")

    # Compute consensus
    consensus = compute_consensus(list(results))
    trace.append(f"🗳️ Consensus: {consensus['confidence_emoji']} {consensus['confidence']} — {consensus['verdict']} ({consensus['signal_score']}/100)")

    # Add individual verdicts to trace
    verdicts_str = " | ".join([f"{v['persona']}: {v['verdict']}" for v in consensus['individual_verdicts']])
    trace.append(f"📊 Votes: {verdicts_str}")

    if consensus['confidence'] == 'UNANIMOUS':
        trace.append("✅ All 3 models agree — UNANIMOUS CONSENSUS")
    elif consensus['confidence'] == 'HIGH':
        trace.append("✅ 2/3 models agree — HIGH CONFIDENCE verdict")
    else:
        trace.append("⚠️ Models disagree — verdict set to DISPUTED")

    trace.append(f"🔧 Repair: {consensus['repair'][:100]}...")

    try:
        verdict = SignalVerdict(consensus['verdict'])
    except:
        verdict = SignalVerdict.NOISE

    # Build enhanced summary with consensus info
    enhanced_summary = consensus['summary']

    result = RepairResult(
        input=query,
        verdict=verdict,
        signal_score=consensus['signal_score'],
        summary=enhanced_summary,
        what_is_accurate=consensus['what_is_accurate'],
        what_is_noise=consensus['what_is_noise'],
        what_changed=consensus['what_changed'],
        sources=sources,
        contradictions=contradictions,
        repair=consensus["repair"],
        consensus_confidence=consensus["confidence"],
        individual_verdicts=[IndividualVerdict(**v) for v in consensus["individual_verdicts"]],
        agent_trace=trace
    )

    return result, trace