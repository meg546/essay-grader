import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from .base import CamelModel


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdateRequest(CamelModel):
    grade_level: str | None = None
    writing_purpose: str | None = None


class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    created_at: datetime
    grade_level: str | None = None
    writing_purpose: str | None = None
