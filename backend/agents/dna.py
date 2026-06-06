import os
import json
import asyncio
from groq import Groq
from agents.scout import scout

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

async def build_dna(claim: str) -> dict:
    """
    Build the DNA of a Lie — a timeline showing how a false claim originated,
    spread, was challenged, and (hopefully) debunked.
    """
    # Get live sources first
    sources, _ = await scout(claim, "claim")
    sources_text = "\n".join([
        f"- {s.title}: {s.snippet[:200]}"
        for s in sources[:6]
    ]) if sources else "No sources found."

    prompt = f"""You are a misinformation researcher. Analyze this claim and build its "DNA" — 
the timeline of how it originated, spread, was challenged, and was debunked.

CLAIM: {claim}

SOURCES FOUND:
{sources_text}

Return ONLY a JSON object with this exact structure:
{{
  "claim": "{claim}",
  "dna_type": "MYTH|MISINFO|OUTDATED|DISPUTED|PARTIAL",
  "one_line_verdict": "<one punchy sentence about this claim>",
  "timeline": [
    {{
      "phase": "ORIGIN",
      "year": "<year or decade e.g. 1930s>",
      "title": "<short title>",
      "description": "<what happened, 1-2 sentences>",
      "source": "<where this comes from>",
      "color": "#6366f1"
    }},
    {{
      "phase": "SPREAD",
      "year": "<year>",
      "title": "<short title>",
      "description": "<how it spread>",
      "source": "<medium/platform>",
      "color": "#f59e0b"
    }},
    {{
      "phase": "AMPLIFIED",
      "year": "<year>",
      "title": "<short title>",
      "description": "<peak spread>",
      "source": "<source>",
      "color": "#ef4444"
    }},
    {{
      "phase": "CHALLENGED",
      "year": "<year>",
      "title": "<short title>",
      "description": "<first serious challenge>",
      "source": "<who challenged it>",
      "color": "#8b5cf6"
    }},
    {{
      "phase": "DEBUNKED",
      "year": "<year>",
      "title": "<short title>",
      "description": "<definitive debunking>",
      "source": "<authoritative source>",
      "color": "#10b981"
    }}
  ],
  "mutation_count": <how many times the claim mutated/changed, integer>,
  "reach_estimate": "<estimated reach e.g. 'billions of people'>",
  "why_it_spreads": "<1-2 sentences on the psychology of why this spreads>",
  "the_truth": "<the actual accurate version in 1-2 sentences>"
}}

Be historically accurate. Use real dates and sources where possible."""

    try:
        response = get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1500
        )
        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        data["sources_used"] = len(sources)
        return data
    except Exception as e:
        return {"error": f"Could not build DNA: {str(e)}"}