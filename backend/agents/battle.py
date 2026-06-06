import os
import json
import asyncio
from groq import Groq
from agents.scout import scout
from agents.critic import critic
from agents.synthesis import synthesize

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

async def analyze_claim(claim: str) -> dict:
    """Run full pipeline on a single claim."""
    sources, _ = await scout(claim, "claim")
    sources, contradictions, _ = await critic(claim, sources)
    result, _ = await synthesize(claim, sources, contradictions, "claim")
    return {
        "claim": claim,
        "verdict": result.verdict,
        "signal_score": result.signal_score,
        "summary": result.summary,
        "repair": result.repair,
        "source_count": len(sources),
        "contradiction_count": len(contradictions),
        "consensus_confidence": result.consensus_confidence or "UNKNOWN",
        "individual_verdicts": [v.model_dump() for v in (result.individual_verdicts or [])],
    }

async def battle(claim_a: str, claim_b: str) -> dict:
    """
    Claim Battle Mode:
    Run both claims through full pipeline in parallel.
    Declare a winner based on signal score + verdict strength.
    """
    # Run both in parallel
    result_a, result_b = await asyncio.gather(
        analyze_claim(claim_a),
        analyze_claim(claim_b)
    )

    # Determine winner
    score_a = result_a["signal_score"]
    score_b = result_b["signal_score"]

    verdict_strength = {
        "TRUE": 6, "MOSTLY_TRUE": 5, "DISPUTED": 3,
        "OUTDATED": 2, "FALSE": 1, "NOISE": 0
    }

    strength_a = verdict_strength.get(result_a["verdict"], 0)
    strength_b = verdict_strength.get(result_b["verdict"], 0)

    # Combined score (signal score + verdict strength * 5)
    combined_a = score_a + (strength_a * 5)
    combined_b = score_b + (strength_b * 5)

    if combined_a > combined_b:
        winner = "A"
        margin = combined_a - combined_b
    elif combined_b > combined_a:
        winner = "B"
        margin = combined_b - combined_a
    else:
        winner = "TIE"
        margin = 0

    # Get AI verdict on the battle
    battle_prompt = f"""You are the judge in a Claim Battle. Two claims were analyzed with live web sources.

CLAIM A: {claim_a}
Signal Score: {score_a}/100 | Verdict: {result_a["verdict"]}
Summary: {result_a["summary"]}

CLAIM B: {claim_b}
Signal Score: {score_b}/100 | Verdict: {result_b["verdict"]}
Summary: {result_b["summary"]}

Winner based on evidence: Claim {winner}

Write a 2-sentence battle verdict explaining why Claim {winner} wins (or why it's a tie).
Be direct and punchy. Start with "Claim {winner} wins because..." or "It's a tie because..."
Return ONLY the verdict text, no JSON."""

    try:
        response = get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": battle_prompt}],
            temperature=0.3,
            max_tokens=200
        )
        battle_verdict = response.choices[0].message.content.strip()
    except:
        battle_verdict = f"Claim {winner} wins based on signal score and source evidence."

    return {
        "claim_a": result_a,
        "claim_b": result_b,
        "winner": winner,
        "margin": margin,
        "combined_score_a": combined_a,
        "combined_score_b": combined_b,
        "battle_verdict": battle_verdict,
    }