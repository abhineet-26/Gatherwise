from fastapi import APIRouter, HTTPException
from ..schemas.ai import ChatRequest, AiResponse, IdeasRequest, IdeasResponse
from ..services.gemini_service import process_chat
from ..services.fallback_service import get_curated_ideas

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/chat", response_model=AiResponse)
async def chat_endpoint(payload: ChatRequest) -> AiResponse:
    try:
        return await process_chat(payload.message, payload.context)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(exc)}")

@router.post("/ideas", response_model=IdeasResponse)
def ideas_endpoint(payload: IdeasRequest) -> IdeasResponse:
    try:
        return get_curated_ideas(payload.context, payload.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ideas generation error: {str(exc)}")
