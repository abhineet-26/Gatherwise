import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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

# Include API Routers (must precede catch-all static router)
app.include_router(health.router)
app.include_router(weather.router)
app.include_router(ai.router)

# Resolve frontend distribution directory for single-service deployment (e.g. Render)
client_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../dist/client"))
if not os.path.exists(client_dist):
    client_dist = os.path.abspath("dist/client")

if os.path.exists(client_dist) and os.path.exists(os.path.join(client_dist, "index.html")):
    assets_dir = os.path.join(client_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_or_file(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        target_file = os.path.join(client_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(client_dist, "index.html"))
else:
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
