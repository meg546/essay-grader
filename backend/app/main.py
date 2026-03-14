from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import auth, grading, health, history, suggestions

settings = get_settings()

app = FastAPI(title="Essay Grader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(grading.router)
api_router.include_router(history.router)
api_router.include_router(suggestions.router)
app.include_router(api_router)
