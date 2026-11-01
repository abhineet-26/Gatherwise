import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .routes import health, weather, ai

app = FastAPI(
    title="GatherWise API (Python)",
    description="Python FastAPI backend service for GatherWise AI celebration planning platform.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Include Routers
app.include_router(health.router)
app.include_router(weather.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {
        "service": "GatherWise Python API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
