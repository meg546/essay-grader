import warnings

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
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.on_event("startup")
async def validate_settings():
    if settings.jwt_secret == "change-me-in-production":
        warnings.warn(
            "JWT secret is using the default value! Set JWT_SECRET in your .env file.",
            stacklevel=1,
        )

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(grading.router)
api_router.include_router(history.router)
api_router.include_router(suggestions.router)
app.include_router(api_router)
