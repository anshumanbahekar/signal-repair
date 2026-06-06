import os
import json
from groq import Groq
from typing import List
from models import Source, Contradiction

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

async def critic(query: str, sources: List[Source]) -> tuple[List[Source], List[Contradiction], List[str]]:
    trace = []
    trace.append("🧐 Critic Agent activated — analyzing sources for contradictions")

    if not sources:
        trace.append("⚠️ No sources to critique — Critic skipping")
        return sources, [], trace

    sources_text = "\n\n".join([
        f"Source {i+1}: {s.title}\nURL: {s.url}\nSnippet: {s.snippet}"
        for i, s in enumerate(sources[:6])
    ])

    prompt = f"""You are the Critic Agent in Signal.repair. Analyze these sources about a claim and find contradictions.

CLAIM/TOPIC: {query}

SOURCES:
{sources_text}

Return ONLY a JSON object, no other text:
{{
  "source_stances": [
    {{"index": 0, "stance": "supports|contradicts|neutral", "reason": "brief reason"}}
  ],
  "contradictions": [
    {{
      "source_a": "title of first source",
      "source_b": "title of second source",
      "description": "what they disagree on"
    }}
  ]
}}"""

    try:
        response = get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )

        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        data = json.loads(raw)

        for stance_data in data.get("source_stances", []):
            idx = stance_data.get("index", -1)
            if 0 <= idx < len(sources):
                sources[idx].stance = stance_data.get("stance", "neutral")

        contradictions = [
            Contradiction(
                source_a=c.get("source_a", ""),
                source_b=c.get("source_b", ""),
                description=c.get("description", "")
            )
            for c in data.get("contradictions", [])
        ]

        supporting = sum(1 for s in sources if s.stance == "supports")
        contradicting = sum(1 for s in sources if s.stance == "contradicts")
        trace.append(f"✅ Critic: {supporting} supporting, {contradicting} contradicting, {len(contradictions)} contradictions found")

    except Exception as e:
        trace.append(f"⚠️ Critic error: {str(e)}")

    return sources, contradictions, trace