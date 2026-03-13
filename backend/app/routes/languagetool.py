"""LanguageTool proxy route — forwards requests to the public LanguageTool API."""

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter(tags=["languagetool"])

LT_UPSTREAM = "https://api.languagetool.org/v2/check"


@router.post("/languagetool/check")
async def languagetool_check(request: Request) -> JSONResponse:
    """Proxy POST requests to the public LanguageTool API.

    Reads the raw request body, forwards it upstream with the same
    Content-Type header, and returns the upstream JSON response
    directly.  On any httpx exception returns 503 with empty matches.
    """
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                LT_UPSTREAM,
                content=body,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        return JSONResponse(status_code=res.status_code, content=res.json())
    except httpx.HTTPError:
        return JSONResponse(status_code=503, content={"matches": []})
