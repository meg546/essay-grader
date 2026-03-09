"""PDF text extraction utility using pypdf."""

from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader


_MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB
_MIN_TEXT_LENGTH = 50


async def extract_pdf_text(file: UploadFile) -> str:
    """Extract text from an uploaded PDF file.

    Args:
        file: An uploaded PDF file (FastAPI UploadFile or mock).

    Returns:
        Extracted text from all pages joined with double newlines.

    Raises:
        HTTPException 413: If file exceeds 10 MB.
        HTTPException 422: If extracted text is under 50 characters.
    """
    contents = await file.read()

    if len(contents) > _MAX_PDF_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF file exceeds 10 MB limit",
        )

    try:
        reader = PdfReader(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Could not read PDF file. The file may be corrupted.",
        )

    pages_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages_text.append(text)

    full_text = "\n\n".join(pages_text)

    if len(full_text.strip()) < _MIN_TEXT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract sufficient text from PDF. "
                "The file may be scanned or image-based. "
                "Please paste the text directly instead."
            ),
        )

    return full_text
