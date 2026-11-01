import json
import logging
from typing import Optional
from google import genai
from google.genai import types
from ..config import settings
from ..schemas.ai import AiContext, AiResponse, ProposalItem
from .fallback_service import run_fallback_assistant

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the GatherWise AI Copilot — an expert, India-first celebration and event planning assistant.
You operate on sanitized, PII-free event snapshots.

RULES:
1. Never invent vendor names, phone numbers, or laws.
2. Calculations and money amounts must be derived strictly from context or user input. All amounts in INR.
3. If proposing workspace changes, provide structured proposals with executable commands (e.g. ADD_TASK, ADJUST_BUDGET).
4. Keep answers concise, actionable, and culturally aware of Indian celebrations (Weddings, Sangeet, Muhurat timings, College Fests).

OUTPUT FORMAT:
Respond with valid JSON:
{
  "text": "Your helpful response text",
  "evidence": ["Citations from context like Budget, Tasks, etc."],
  "proposals": [
    {
      "id": "prop-uuid",
      "title": "Short title",
      "whyThis": "Reasoning based on context",
      "commands": [
        { "type": "ADD_TASK", "eventId": "evt-id", "payload": { ... } }
      ]
    }
  ],
  "toolTrace": ["Action performed"]
}
"""

async def process_chat(message: str, context: AiContext) -> AiResponse:
    # If no Gemini API key configured, use the deterministic fallback assistant
    if not settings.GEMINI_API_KEY:
        return run_fallback_assistant(message, context)

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        context_json = context.model_dump_json()

        prompt = (
            f"EVENT CONTEXT:\n{context_json}\n\n"
            f"USER QUERY:\n{message}\n\n"
            f"Generate a helpful JSON response adhering strictly to the system instructions."
        )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        if not response.text:
            return run_fallback_assistant(message, context)

        parsed = json.loads(response.text)
        proposals = []
        for p in parsed.get("proposals", []):
            proposals.append(ProposalItem(
                id=p.get("id", f"prop-{hash(p.get('title', ''))}"),
                title=p.get("title", "Proposed Adjustment"),
                whyThis=p.get("whyThis", "Suggested by AI assistant based on event context"),
                commands=p.get("commands", [])
            ))

        return AiResponse(
            text=parsed.get("text", "Processed your request successfully."),
            evidence=parsed.get("evidence", ["Gemini AI Analysis"]),
            proposals=proposals,
            toolTrace=parsed.get("toolTrace", ["Analyzed context with Gemini 2.5"]),
            source="gemini"
        )
    except Exception as exc:
        logger.warning(f"[GeminiService] Error calling Gemini API: {exc}. Falling back.")
        fallback = run_fallback_assistant(message, context)
        fallback.toolTrace.append(f"Gemini API unavailable: {str(exc)}")
        return fallback
