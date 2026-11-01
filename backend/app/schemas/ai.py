from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class EventContext(BaseModel):
    id: str
    type: str
    subtype: Optional[str] = None
    date: str
    daysToEvent: int
    city: str
    budgetTarget: int
    contingencyPct: float = 10.0
    setting: Optional[str] = "outdoor"
    priorities: List[str] = Field(default_factory=list)
    dietaryTags: List[str] = Field(default_factory=list)

class SubEventContext(BaseModel):
    id: str
    name: str
    date: str

class BudgetLineContext(BaseModel):
    id: str
    category: str
    estimate: int
    locked: bool = False

class CommitmentContext(BaseModel):
    id: str
    budgetLineId: str
    amount: int
    status: str

class PaymentContext(BaseModel):
    id: str
    budgetLineId: str
    amount: int
    status: str
    dueDate: Optional[str] = None

class VendorContext(BaseModel):
    id: str
    name: str
    category: str
    status: str

class QuoteContext(BaseModel):
    id: str
    vendorId: str
    title: str
    pricingModel: str
    baseAmount: int
    taxMode: str
    gstPct: Optional[float] = 18.0
    inclusions: Dict[str, bool] = Field(default_factory=dict)
    validUntil: Optional[str] = None
    status: str

class TaskContext(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    dueDate: str
    status: str

class RiskContext(BaseModel):
    id: str
    title: str
    severity: str
    status: str

class AiContext(BaseModel):
    event: EventContext
    subEvents: List[SubEventContext] = Field(default_factory=list)
    budgetLines: List[BudgetLineContext] = Field(default_factory=list)
    commitments: List[CommitmentContext] = Field(default_factory=list)
    payments: List[PaymentContext] = Field(default_factory=list)
    vendors: List[VendorContext] = Field(default_factory=list)
    quotes: List[QuoteContext] = Field(default_factory=list)
    tasks: List[TaskContext] = Field(default_factory=list)
    risks: List[RiskContext] = Field(default_factory=list)
    totalHeadcount: int = 100

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    context: AiContext

class IdeasRequest(BaseModel):
    context: AiContext
    query: Optional[str] = Field(default=None, max_length=300)

class BaseCommand(BaseModel):
    type: str
    eventId: str
    payload: Dict[str, Any]

class ProposalItem(BaseModel):
    id: str
    title: str
    whyThis: str
    commands: List[Dict[str, Any]]
    impact: Optional[Dict[str, Any]] = None

class AiResponse(BaseModel):
    text: str
    evidence: List[str] = Field(default_factory=list)
    proposals: List[ProposalItem] = Field(default_factory=list)
    toolTrace: List[str] = Field(default_factory=list)
    unverifiedNumbers: Optional[List[str]] = Field(default_factory=list)
    source: Literal["gemini", "fallback"] = "fallback"

class IdeaItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    culturalSignificance: Optional[str] = None
    estimatedCostPaise: Optional[int] = None
    suggestedTaskTitle: Optional[str] = None

class IdeasResponse(BaseModel):
    ideas: List[IdeaItem] = Field(default_factory=list)
