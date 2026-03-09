"""Tests for auth utility modules: password hashing and JWT tokens."""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.auth.passwords import hash_password, verify_password
from app.auth.tokens import create_access_token, decode_access_token
from app.config import get_settings


class TestPasswordHashing:
    def test_hash_password_returns_different_string(self):
        hashed = hash_password("mysecret")
        assert isinstance(hashed, str)
        assert hashed != "mysecret"

    def test_verify_password_correct(self):
        hashed = hash_password("mysecret")
        assert verify_password("mysecret", hashed) is True

    def test_verify_password_wrong(self):
        hashed = hash_password("mysecret")
        assert verify_password("wrong", hashed) is False


class TestJWTTokens:
    def test_create_access_token_returns_string(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token_roundtrip(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        decoded_id = decode_access_token(token)
        assert decoded_id == user_id

    def test_decode_access_token_garbage_raises(self):
        with pytest.raises(ValueError, match="Invalid or expired token"):
            decode_access_token("garbage")

    def test_decode_access_token_expired_raises(self):
        settings = get_settings()
        expired_payload = {
            "sub": str(uuid.uuid4()),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(
            expired_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm
        )
        with pytest.raises(ValueError, match="Invalid or expired token"):
            decode_access_token(expired_token)
