"""Tests for the LanguageTool proxy route."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_proxy_forwards_request(client: AsyncClient) -> None:
    """Proxy returns the upstream response when the LanguageTool API succeeds."""
    upstream_body = {"matches": [{"offset": 0, "length": 4, "message": "test"}]}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = upstream_body

    with patch(
        "app.routes.languagetool.httpx.AsyncClient",
        return_value=AsyncMock(
            __aenter__=AsyncMock(
                return_value=AsyncMock(post=AsyncMock(return_value=mock_response))
            ),
            __aexit__=AsyncMock(return_value=False),
        ),
    ):
        response = await client.post(
            "/api/languagetool/check",
            content=b"text=hello&language=auto",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body["matches"]) == 1


@pytest.mark.asyncio
async def test_proxy_returns_503_on_upstream_failure(client: AsyncClient) -> None:
    """Proxy returns 503 with empty matches when httpx raises a connection error."""
    with patch(
        "app.routes.languagetool.httpx.AsyncClient",
        return_value=AsyncMock(
            __aenter__=AsyncMock(
                return_value=AsyncMock(
                    post=AsyncMock(side_effect=httpx.ConnectError("refused"))
                )
            ),
            __aexit__=AsyncMock(return_value=False),
        ),
    ):
        response = await client.post(
            "/api/languagetool/check",
            content=b"text=hello&language=auto",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 503
    assert response.json() == {"matches": []}


@pytest.mark.asyncio
async def test_proxy_forwards_429(client: AsyncClient) -> None:
    """Proxy forwards a 429 status code from the upstream LanguageTool API."""
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.json.return_value = {"matches": []}

    with patch(
        "app.routes.languagetool.httpx.AsyncClient",
        return_value=AsyncMock(
            __aenter__=AsyncMock(
                return_value=AsyncMock(post=AsyncMock(return_value=mock_response))
            ),
            __aexit__=AsyncMock(return_value=False),
        ),
    ):
        response = await client.post(
            "/api/languagetool/check",
            content=b"text=hello&language=auto",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 429
    assert response.json() == {"matches": []}
