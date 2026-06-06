import os
import json
import asyncio
import httpx
from groq import Groq

def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))

async def fetch_article(url: str) -> tuple[str, str]:
    """Fetch article using Tavily extract — bypasses anti-scraping."""
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    
    # Try Tavily extract first
    if tavily_key:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api.tavily.com/extract",
                    json={"urls": [url], "api_key": tavily_key}
                )
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    if results and results[0].get("raw_content"):
                        content = results[0]["raw_content"][:5000]
                        title = results[0].get("url", url)
                        return content, title
        except Exception as e:
            pass

    # Fallback: direct fetch with browser headers
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=headers) as client:
            response = await client.get(url)
            html = response.text
            
            # Extract title
            title = ""
            if "<title>" in html:
                start = html.find("<title>") + 7
                end = html.find("</title>", start)
                title = html[start:end].strip()[:100]
            
            # Simple text extraction — remove HTML tags
            import re
            # Remove scripts and styles
            html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
            html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
            # Remove HTML tags
            text = re.sub(r'<[^>]+>', ' ', html)
            # Clean whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            if len(text) > 200:
                return text[:5000], title
    except Exception as e:
        pass

    # Last resort: use Tavily search to find article content
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))
        response = client.search(query=f"site:{url.split('/')[2]} {url}", max_results=1)
        results = response.get("results", [])
        if results:
            content = results[0].get("content", "")
            title = results[0].get("title", url)
            if len(content) > 100:
                return content, title
    except:
        pass

    return "", ""

async def extract_claims(text: str, title: str) -> list[str]:
    """Extract key factual claims from article text."""
    prompt = f"""You are a fact-checking expert. Extract exactly 5 specific, verifiable factual claims from this article.

TITLE: {title}

ARTICLE TEXT:
{text[:3000]}

Rules:
- Each claim must be a specific, verifiable statement
- Self-contained (makes sense without context)
- Factual, not opinion
- Different aspects of the article

Return ONLY a JSON array of exactly 5 claim strings. No other text.
Example: ["The moon landing occurred in 1969", "Neil Armstrong walked on the moon"]"""

    try:
        response = get_client().chat.completions.create(
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
        claims = json.loads(raw)
        return claims[:5] if isinstance(claims, list) else []
    except Exception as e:
        return []

async def verify_claim_quick(claim: str) -> dict:
    """Quick verification of a single claim."""
    from agents.scout import scout
    from agents.critic import critic
    from agents.synthesis import synthesize

    sources, _ = await scout(claim, "claim")
    sources, contradictions, _ = await critic(claim, sources)
    result, _ = await synthesize(claim, sources, contradictions, "claim")

    return {
        "claim": claim,
        "verdict": result.verdict,
        "signal_score": result.signal_score,
        "repair": result.repair,
        "source_count": len(sources),
        "consensus_confidence": result.consensus_confidence or "UNKNOWN"
    }

async def analyze_url(url: str) -> dict:
    """Full URL analysis pipeline."""
    # Fetch article
    text, title = await fetch_article(url)
    if not text or len(text) < 100:
        return {"error": "Could not extract article content. Try a different URL or paste the article text directly."}

    # Extract claims
    claims = await extract_claims(text, title)
    if not claims:
        return {"error": "Could not extract verifiable claims from this article."}

    # Verify all claims in parallel
    tasks = [verify_claim_quick(claim) for claim in claims]
    results = await asyncio.gather(*tasks)

    scores = [r["signal_score"] for r in results]
    verdicts = [r["verdict"] for r in results]

    verdict_counts: dict = {}
    for v in verdicts:
        verdict_counts[v] = verdict_counts.get(v, 0) + 1

    avg_score = int(sum(scores) / len(scores)) if scores else 0

    if avg_score >= 75:
        overall = "CREDIBLE"
    elif avg_score >= 50:
        overall = "MIXED"
    elif avg_score >= 25:
        overall = "QUESTIONABLE"
    else:
        overall = "UNRELIABLE"

    return {
        "url": url,
        "title": title,
        "article_preview": text[:300] + "..." if len(text) > 300 else text,
        "claims_analyzed": len(results),
        "overall_credibility": overall,
        "overall_score": avg_score,
        "verdict_counts": verdict_counts,
        "claim_results": list(results)
    }