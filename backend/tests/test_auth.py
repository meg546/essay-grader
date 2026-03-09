"""Integration tests for auth endpoints (register, login, me)."""

import pytest


async def test_register_success(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_register_duplicate_email(client):
    await client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "testpass123"},
    )
    resp = await client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 409


async def test_register_invalid_email(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "testpass123"},
    )
    assert resp.status_code == 422


async def test_register_short_password(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "short"},
    )
    assert resp.status_code == 422


async def test_login_success(client):
    await client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "testpass123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/register",
        json={"email": "wrong@example.com", "password": "testpass123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


async def test_login_nonexistent_email(client):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 401


async def test_me_returns_user(client):
    reg = await client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "testpass123"},
    )
    token = reg.json()["access_token"]
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me@example.com"
    assert "id" in data
    assert "createdAt" in data  # camelCase from CamelModel


async def test_me_without_token(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


async def test_me_invalid_token(client):
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token-here"},
    )
    assert resp.status_code == 401


async def test_register_login_me_roundtrip(client):
    """Full round-trip: register -> login -> /me."""
    email = "roundtrip@example.com"
    password = "testpass123"

    # Register
    reg = await client.post(
        "/api/auth/register", json={"email": email, "password": password}
    )
    assert reg.status_code == 201

    # Login
    login = await client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    # Get profile
    me = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == email
