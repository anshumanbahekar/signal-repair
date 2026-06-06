from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class SignalVerdict(str, Enum):
    TRUE = "TRUE"
    MOSTLY_TRUE = "MOSTLY_TRUE"
    DISPUTED = "DISPUTED"
    OUTDATED = "OUTDATED"
    FALSE = "FALSE"
    NOISE = "NOISE"

class Source(BaseModel):
    url: str
    title: str
    snippet: str
    credibility_score: float
    stance: str
    published_date: Optional[str] = None

class Contradiction(BaseModel):
    source_a: str
    source_b: str
    description: str

class IndividualVerdict(BaseModel):
    persona: str
    model: str
    verdict: str
    score: int

class RepairRequest(BaseModel):
    input: str
    mode: str = "claim"

class RepairResult(BaseModel):
    input: str
    verdict: SignalVerdict
    signal_score: int
    summary: str
    what_is_accurate: str
    what_is_noise: str
    what_changed: Optional[str] = None
    sources: List[Source]
    contradictions: List[Contradiction]
    repair: str
    agent_trace: List[str]
    consensus_confidence: Optional[str] = None
    individual_verdicts: Optional[List[IndividualVerdict]] = None

class WatchRequest(BaseModel):
    topic: str
    frequency: str = "daily"
    email: Optional[str] = None

class WatchResult(BaseModel):
    watch_id: str
    topic: str
    status: str
    message: str