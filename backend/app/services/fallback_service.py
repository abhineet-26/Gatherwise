from typing import List, Optional
from ..schemas.ai import AiContext, AiResponse, ProposalItem, IdeaItem, IdeasResponse

def format_inr(paise: int) -> str:
    rupees = paise // 100
    if rupees >= 10000000:
        return f"₹{rupees / 10000000:.2f} Cr"
    elif rupees >= 100000:
        return f"₹{rupees / 100000:.2f} Lakh"
    else:
        return f"₹{rupees:,}"

def run_fallback_assistant(message: str, context: AiContext) -> AiResponse:
    q = message.lower().strip()

    # 1. Budget queries
    if any(k in q for k in ["budget", "spend", "cost", "variance", "money"]):
        total_estimate = sum(line.estimate for line in context.budgetLines)
        total_committed = sum(c.amount for c in context.commitments if c.status == "accepted")
        total_paid = sum(p.amount for p in context.payments if p.status == "paid")
        target = context.event.budgetTarget

        remaining = target - total_committed
        is_over = remaining < 0

        target_str = format_inr(target)
        committed_str = format_inr(total_committed)
        paid_str = format_inr(total_paid)
        diff_str = format_inr(abs(remaining))

        if is_over:
            text = (
                f"You are currently {diff_str} over your total target budget of {target_str}. "
                f"Total commitments stand at {committed_str}, with {paid_str} already disbursed across vendors."
            )
        else:
            text = (
                f"Your budget is on track within your target of {target_str}. "
                f"Total committed expenses are {committed_str} ({paid_str} disbursed), leaving a headroom of {diff_str}."
            )

        return AiResponse(
            text=text,
            evidence=["Budget Summary", f"Committed: {committed_str}", f"Target: {target_str}"],
            proposals=[],
            toolTrace=["Calculated budget summary from active lines & commitments"],
            source="fallback"
        )

    # 2. Tasks / Schedule
    if any(k in q for k in ["task", "overdue", "next", "priority", "critical"]):
        overdue_tasks = [t for t in context.tasks if t.status == "overdue"]
        pending_tasks = [t for t in context.tasks if t.status in ("pending", "in_progress")]

        selected = overdue_tasks if ("overdue" in q and overdue_tasks) else pending_tasks
        if not selected:
            return AiResponse(
                text=f"Great news! You have no pending or overdue tasks at this stage for your {context.event.type} in {context.event.city}.",
                evidence=["Task checklist (0 pending)"],
                proposals=[],
                toolTrace=["Scanned active tasks against current date"],
                source="fallback"
            )

        lines = [f"• {t.title} (Due: {t.dueDate}, Priority: {t.priority})" for t in selected[:5]]
        text = f"Here are the top priority tasks needing your attention:\n" + "\n".join(lines)
        return AiResponse(
            text=text,
            evidence=[f"{len(selected)} tasks needing action"],
            proposals=[],
            toolTrace=["Retrieved task list filtered by urgency"],
            source="fallback"
        )

    # 3. Weather / Rain Contingency
    if any(k in q for k in ["rain", "weather", "heat", "wind", "outdoor"]):
        risks = context.risks
        text = (
            f"Weather advisory for {context.event.city}: Ensure all outdoor functions have waterproof "
            f"canopy coverage or an adjacent indoor hall reserved. A contingency reserve of 10% is recommended."
        )
        proposals = [
            ProposalItem(
                id="prop-weather-1",
                title="Reserve waterproof marquee & covered corridor",
                whyThis="Protects outdoor banquet setup against sudden rain showers",
                commands=[{
                    "type": "ADD_TASK",
                    "eventId": context.event.id,
                    "payload": {
                        "id": f"task-wx-{context.event.id}",
                        "title": "Confirm waterproof marquee & rain tarps with decorator",
                        "category": "venue",
                        "priority": "high",
                        "dueDate": context.event.date,
                        "status": "pending"
                    }
                }]
            )
        ]
        return AiResponse(
            text=text,
            evidence=["Open-Meteo 16-day advisory", f"City: {context.event.city}"],
            proposals=proposals,
            toolTrace=["Evaluated outdoor venue weather safeguards"],
            source="fallback"
        )

    # Default general guidance
    return AiResponse(
        text=(
            f"I am your GatherWise assistant for your {context.event.type} in {context.event.city}. "
            f"With {context.event.daysToEvent} days remaining and {context.totalHeadcount} expected guests, "
            f"I can help you audit budget allocations, evaluate caterer/venue quotes, or plan schedule buffers."
        ),
        evidence=[f"Event: {context.event.type}", f"Days left: {context.event.daysToEvent}"],
        proposals=[],
        toolTrace=["Context summary analyzed"],
        source="fallback"
    )

def get_curated_ideas(context: AiContext, query: Optional[str] = None) -> IdeasResponse:
    ideas = [
        IdeaItem(
            id="idea-1",
            title="Live Jalebi & Rabri Station with Kulhad Chai",
            category="catering",
            description="Interactive hot dessert station serving freshly fried crisp jalebis with saffron rabri in clay kulhads.",
            culturalSignificance="Traditional North and Central Indian celebratory sweet symbolising joy and prosperity.",
            estimatedCostPaise=1500000,
            suggestedTaskTitle="Book artisanal jalebi chef & clay kulhads"
        ),
        IdeaItem(
            id="idea-2",
            title="Acoustic Sitar & Tabla Welcome Ensemble",
            category="entertainment",
            description="Live classical instrumental musicians playing gentle raags (Bhairav/Yaman) at the welcome foyer as guests arrive.",
            culturalSignificance="Creates a royal, serene heritage atmosphere without overpowering conversational sound levels.",
            estimatedCostPaise=2500000,
            suggestedTaskTitle="Coordinate audio mics for welcome ensemble"
        ),
        IdeaItem(
            id="idea-3",
            title="Locally-Crafted Seed Paper Itinerary Scrolls",
            category="decor",
            description="Eco-friendly plantable seed paper printing for the function run-of-show that guests can take home and plant.",
            culturalSignificance="Sustainable zero-waste celebration touch celebrating growth and nature.",
            estimatedCostPaise=800000,
            suggestedTaskTitle="Order handmade seed paper scrolls"
        )
    ]
    return IdeasResponse(ideas=ideas)
