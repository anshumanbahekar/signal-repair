import os
import httpx
from typing import List
from models import Source

def get_tavily_client():
    from tavily import TavilyClient
    return TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))

async def scout(query: str, mode: str = "claim") -> tuple[List[Source], List[str]]:
    trace = []
    trace.append(f"🔍 Scout Agent activated for: '{query[:80]}'")

    search_query = {
        "claim": f"fact check verify: {query}",
        "hallucination": f"fact check verify: {query}",
        "url": f"analysis review: {query}",
        "topic": query,
    }.get(mode, query)

    sources = []

    # Try Nimble first
    nimble_key = os.getenv("NIMBLE_API_KEY", "")
    if nimble_key:
        try:
            trace.append("📡 Scout searching via Nimble Web Intelligence...")
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api.webit.live/api/v1/realtime/serp",
                    headers={
                        "Authorization": f"Basic {nimble_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "query": search_query,
                        "search_engine": "google_search",
                        "country": "US",
                        "locale": "en",
                        "num_results": 8
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("parsing", {}).get("entities", {}).get("OrganicResult", [])
                    for r in results[:8]:
                        url = r.get("url", "")
                        sources.append(Source(
                            url=url,
                            title=r.get("title", "Unknown"),
                            snippet=r.get("description", "")[:300],
                            credibility_score=_score_credibility(url),
                            stance="neutral",
                            published_date=r.get("date", None)
                        ))
                    trace.append(f"✅ Nimble retrieved {len(sources)} live results")
        except Exception as e:
            trace.append(f"⚠️ Nimble error: {str(e)} — falling back to Tavily")

    # Fallback to Tavily
    if not sources:
        try:
            trace.append("📡 Scout searching via Tavily...")
            client = get_tavily_client()
            response = client.search(
                query=search_query,
                search_depth="advanced",
                max_results=8,
                include_answer=False,
                include_raw_content=False,
            )
            results = response.get("results", [])
            trace.append(f"✅ Tavily retrieved {len(results)} live results")
            for r in results:
                url = r.get("url", "")
                sources.append(Source(
                    url=url,
                    title=r.get("title", "Unknown Source"),
                    snippet=r.get("content", "")[:300],
                    credibility_score=_score_credibility(url),
                    stance="neutral",
                    published_date=r.get("published_date", None)
                ))
        except Exception as e:
            trace.append(f"⚠️ Tavily error: {str(e)}")

    trace.append(f"📊 Scout scored credibility for {len(sources)} sources")

    if not sources:
        trace.append("ℹ️ No live sources found — Synthesis will use internal knowledge")

    return sources, trace


def _score_credibility(url: str) -> float:
    high = ["reuters.com", "apnews.com", "bbc.com", "theguardian.com", "nytimes.com",
            "washingtonpost.com", "snopes.com", "factcheck.org", "politifact.com",
            "nature.com", "who.int", "cdc.gov", "nih.gov", "nasa.gov", ".edu", ".gov"]
    medium = ["cnn.com", "nbcnews.com", "abcnews.com", "cbsnews.com", "time.com",
              "forbes.com", "bloomberg.com", "techcrunch.com", "wired.com", "scientificamerican.com"]
    low = ["reddit.com", "twitter.com", "facebook.com", "tiktok.com", "blogspot.com"]
    url_lower = url.lower()
    for d in high:
        if d in url_lower: return 0.88
    for d in medium:
        if d in url_lower: return 0.65
    for d in low:
        if d in url_lower: return 0.2
    return 0.50