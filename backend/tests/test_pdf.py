"""Unit tests for PDF text extraction utility."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException


@pytest.fixture
def valid_pdf_bytes() -> bytes:
    """Generate a small valid PDF with known text content."""
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 84>>stream\n"
        b"BT /F1 12 Tf 100 700 Td "
        b"(This is a test essay with enough text to pass the minimum threshold check.) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000266 00000 n \n"
        b"0000000400 00000 n \n"
        b"trailer<</Size 6/Root 1 0 R>>\n"
        b"startxref\n470\n%%EOF"
    )
    return pdf_content


def _make_upload_file(content: bytes, filename: str = "test.pdf") -> MagicMock:
    """Create a mock UploadFile with async read()."""
    mock = MagicMock()
    mock.filename = filename
    mock.read = AsyncMock(return_value=content)
    return mock


@pytest.mark.asyncio
async def test_extract_valid_pdf(valid_pdf_bytes: bytes):
    """extract_pdf_text with a real PDF UploadFile returns extracted text."""
    from app.llm.pdf import extract_pdf_text

    upload = _make_upload_file(valid_pdf_bytes)
    text = await extract_pdf_text(upload)
    assert isinstance(text, str)
    assert len(text.strip()) >= 50


@pytest.mark.asyncio
async def test_extract_pdf_exceeds_size_limit():
    """PDF over 10 MB raises HTTPException 413."""
    from app.llm.pdf import extract_pdf_text

    oversized = b"x" * (10 * 1024 * 1024 + 1)
    upload = _make_upload_file(oversized)
    with pytest.raises(HTTPException) as exc_info:
        await extract_pdf_text(upload)
    assert exc_info.value.status_code == 413
    assert "10 MB" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_extract_pdf_insufficient_text():
    """PDF with < 50 chars of text raises HTTPException 422 with helpful message."""
    from app.llm.pdf import extract_pdf_text

    # Build a PDF with very short text
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 25>>stream\n"
        b"BT /F1 12 Tf (Hi) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000266 00000 n \n"
        b"0000000340 00000 n \n"
        b"trailer<</Size 6/Root 1 0 R>>\n"
        b"startxref\n410\n%%EOF"
    )
    upload = _make_upload_file(pdf_content)
    with pytest.raises(HTTPException) as exc_info:
        await extract_pdf_text(upload)
    assert exc_info.value.status_code == 422
    assert "paste the text directly" in str(exc_info.value.detail).lower() or "paste" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_extract_pdf_empty_file():
    """Empty/corrupt PDF raises appropriate error."""
    from app.llm.pdf import extract_pdf_text

    upload = _make_upload_file(b"not a pdf")
    with pytest.raises((HTTPException, Exception)):
        await extract_pdf_text(upload)
