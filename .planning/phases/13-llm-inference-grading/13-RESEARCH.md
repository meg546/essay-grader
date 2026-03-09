# Phase 13: LLM Inference & Grading - Research

**Researched:** 2026-03-09
**Domain:** LLM inference pipeline, multi-provider abstraction, structured output, PDF text extraction, fuzzy text matching
**Confidence:** MEDIUM-HIGH

## Summary

Phase 13 builds the core grading pipeline: a single POST endpoint that accepts essay text (or PDF) plus optional rubric, sends it to an LLM via a configurable provider (Ollama, Anthropic, OpenAI), validates the structured JSON response against existing Pydantic schemas, computes character-offset highlights via fuzzy matching, and returns a complete GradingResult. The three providers each have different structured output mechanisms but can be unified behind a common async interface.

The primary risk is structured output reliability with smaller local models (Llama 3.2 3B via Ollama). Provider-native JSON modes constrain output format but cannot guarantee semantic correctness. Post-inference validation with Pydantic and a single retry on malformed output is essential. The highlight pipeline (LLM quotes passages, Python finds offsets) is a novel pattern that needs careful fuzzy matching with graceful degradation.

**Primary recommendation:** Use Python Protocol (typing) for the LLM client interface, httpx.AsyncClient for Ollama HTTP calls, native SDKs for Anthropic/OpenAI, pypdf for PDF extraction, and difflib (stdlib) for fuzzy matching with rapidfuzz as optional upgrade path.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Ollama as primary local model server, calling OpenAI-compatible /v1/chat/completions endpoint
- Provider adapter pattern: abstract LLMClient interface with three adapters (Ollama, Anthropic, OpenAI)
- All three providers supported at launch -- swap via MODEL_PROVIDER env var
- Separate env vars: MODEL_PROVIDER (ollama/anthropic/openai), MODEL_NAME (e.g., llama3.2:3b), MODEL_ENDPOINT (e.g., http://localhost:11434)
- For Anthropic: uses ANTHROPIC_API_KEY env var; for OpenAI: uses OPENAI_API_KEY
- Retry once on timeout/connection error, then return 502/503 with clear error message
- Single prompt approach: one LLM call produces complete GradingResult JSON
- Provider-native JSON modes: Ollama format=json, Anthropic tool_use with schema, OpenAI response_format json_object
- Grade level affects scoring via prompt injection in system prompt
- Default rubric used when no rubric provided
- Two-pass highlight generation: LLM quotes text, Python computes offsets
- Fuzzy matching with fallback: exact str.find() first, then fuzzy match
- LLM decides highlight count per category, overlapping allowed, empty highlights accepted
- Single endpoint POST /api/grade with multipart form data
- Accepts optional rubric_file (PDF) OR rubric_text (string), plus optional essay_file (PDF) OR essay_text (string)
- Backend extracts text from PDFs using pypdf (not PyMuPDF due to AGPL)
- Minimum length validation: if extracted PDF text under ~50 chars, return 422
- 10 MB max file size limit for PDF uploads (413 on exceed)

### Claude's Discretion
- Exact system prompt wording and structure
- Inference timeout duration
- Fuzzy matching threshold and algorithm choice
- Default rubric content and category definitions
- Pydantic validation/retry logic for malformed LLM output
- Error response message wording

### Deferred Ideas (OUT OF SCOPE)
- Frontend needs to stop doing client-side PDF extraction and instead upload PDFs to backend -- Phase 15
- Streaming SSE for progressive result rendering during inference -- v2.1 (STREAM-01, STREAM-02)
- Dynamic rubric-aligned category generation -- v2.1 (ADVGRADE-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRADE-01 | User can submit essay + rubric and receive full GradingResult JSON (POST /api/grade) | Provider adapter pattern, prompt engineering, structured output validation, endpoint design |
| GRADE-02 | Backend generates character-offset highlight ranges via two-pass approach (LLM quotes text, Python computes offsets) | Fuzzy matching strategy (difflib/rapidfuzz), highlight computation algorithm |
| GRADE-03 | Grading adjusts scoring strictness based on grade level parameter | Prompt engineering pattern with grade-level context injection |
| GRADE-04 | Model inference endpoint is configurable via environment variable (local/LAN/cloud) | Settings pattern, provider adapter interface, env var design |
| PDF-01 | Backend extracts rubric text from uploaded PDF server-side using pypdf | pypdf PdfReader API, text extraction patterns |
| PDF-02 | Grading endpoint accepts both PDF file upload (multipart) and pre-extracted text (JSON) | FastAPI multipart form handling, UploadFile + Form parameters |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| httpx | >=0.28.1 | Async HTTP client for Ollama API calls | Already in dev deps; async-native, timeout control, used throughout project |
| anthropic | >=0.45.0 | Anthropic Claude SDK with AsyncAnthropic | Official SDK, native structured outputs support, async client |
| openai | >=1.60.0 | OpenAI SDK with AsyncOpenAI | Official SDK, json_object response_format, async client |
| pypdf | >=5.0.0 | PDF text extraction | User-specified; BSD license (avoids PyMuPDF AGPL); pure Python |
| pydantic | (existing) | LLM output validation | Already in project; validates GradingResult shape |
| pydantic-settings | (existing) | Environment configuration | Already in project; add MODEL_PROVIDER, MODEL_NAME, MODEL_ENDPOINT |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| difflib | (stdlib) | Fuzzy string matching for highlight offsets | Default fuzzy matcher; no extra dependency |
| rapidfuzz | >=3.0.0 | Faster fuzzy matching (C++ backed) | Optional upgrade if difflib too slow; not needed initially |
| python-multipart | (existing) | Multipart form data parsing | Already in deps; required for PDF file uploads |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| httpx for Ollama | ollama Python SDK | httpx avoids extra dependency; Ollama SDK adds native format param but httpx works with OpenAI-compat endpoint |
| difflib for fuzzy matching | rapidfuzz | difflib is stdlib (zero deps); rapidfuzz is 10-100x faster but adds C dependency. Start with difflib. |
| Per-provider SDK | All via OpenAI SDK | OpenAI SDK can target Ollama and OpenAI but cannot target Anthropic; separate SDKs give access to provider-native features |

**Installation:**
```bash
cd backend && uv add httpx anthropic openai pypdf
```

Note: httpx is already a dev dependency; moving to main deps. python-multipart already in deps via fastapi[standard].

## Architecture Patterns

### Recommended Project Structure
```
backend/app/
├── config.py              # Add MODEL_PROVIDER, MODEL_NAME, MODEL_ENDPOINT, API keys
├── schemas/
│   └── grading.py         # Existing GradingResult, CategoryScore, HighlightRange (no changes)
├── llm/
│   ├── __init__.py
│   ├── client.py           # LLMClient Protocol + factory function
│   ├── ollama.py           # OllamaClient(LLMClient) — httpx async
│   ├── anthropic.py        # AnthropicClient(LLMClient) — anthropic SDK async
│   ├── openai.py           # OpenAIClient(LLMClient) — openai SDK async
│   ├── prompts.py          # System/user prompt templates, default rubric
│   └── highlights.py       # Quote-to-offset matching logic
├── services/
│   └── grading.py          # GradingService: orchestrates prompt → LLM → validate → highlights
├── routes/
│   └── grading.py          # POST /api/grade endpoint with multipart handling
└── main.py                 # Mount grading router
```

### Pattern 1: LLM Client Protocol
**What:** Python Protocol defining the async interface all providers implement
**When to use:** Always -- this is the provider abstraction layer
**Example:**
```python
from typing import Protocol

class LLMClient(Protocol):
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        json_schema: dict,
    ) -> str:
        """Return raw JSON string from LLM."""
        ...

def get_llm_client(settings: Settings) -> LLMClient:
    match settings.model_provider:
        case "ollama":
            return OllamaClient(settings)
        case "anthropic":
            return AnthropicClient(settings)
        case "openai":
            return OpenAIClient(settings)
        case _:
            raise ValueError(f"Unknown provider: {settings.model_provider}")
```

### Pattern 2: Provider-Native Structured Output
**What:** Each adapter uses its provider's native JSON constraint mechanism
**When to use:** Inside each LLMClient implementation

**Ollama (via httpx to OpenAI-compat endpoint):**
```python
import httpx

class OllamaClient:
    def __init__(self, settings: Settings):
        self._client = httpx.AsyncClient(
            base_url=f"{settings.model_endpoint}/v1",
            timeout=httpx.Timeout(120.0, connect=10.0),
        )
        self._model = settings.model_name

    async def complete(self, system_prompt: str, user_prompt: str, json_schema: dict) -> str:
        response = await self._client.post(
            "/chat/completions",
            json={
                "model": self._model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
```

**Anthropic (via SDK):**
```python
from anthropic import AsyncAnthropic

class AnthropicClient:
    def __init__(self, settings: Settings):
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.model_name

    async def complete(self, system_prompt: str, user_prompt: str, json_schema: dict) -> str:
        # Use tool_use to force structured JSON output
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[{
                "name": "submit_grading_result",
                "description": "Submit the grading result",
                "input_schema": json_schema,
            }],
            tool_choice={"type": "tool", "name": "submit_grading_result"},
        )
        # Extract tool_use input (already parsed dict) and serialize
        import json
        for block in response.content:
            if block.type == "tool_use":
                return json.dumps(block.input)
        raise ValueError("No tool_use block in response")
```

**OpenAI (via SDK):**
```python
from openai import AsyncOpenAI

class OpenAIClient:
    def __init__(self, settings: Settings):
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.model_name

    async def complete(self, system_prompt: str, user_prompt: str, json_schema: dict) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return response.choices[0].message.content
```

### Pattern 3: Highlight Offset Computation
**What:** Post-inference matching of LLM-quoted passages to character offsets in original essay
**When to use:** After LLM returns grading result with quoted text passages

```python
import difflib

def find_passage_offset(essay_text: str, quoted_text: str, threshold: float = 0.6) -> tuple[int, int] | None:
    """Find character offsets for a quoted passage in the essay text.

    Returns (start, end) tuple or None if no match above threshold.
    """
    # Pass 1: exact match
    idx = essay_text.lower().find(quoted_text.lower())
    if idx >= 0:
        return (idx, idx + len(quoted_text))

    # Pass 2: fuzzy sliding window
    quote_len = len(quoted_text)
    best_ratio = 0.0
    best_start = 0

    # Slide window across essay text
    step = max(1, quote_len // 4)
    for start in range(0, len(essay_text) - quote_len + 1, step):
        candidate = essay_text[start:start + quote_len]
        ratio = difflib.SequenceMatcher(None, quoted_text.lower(), candidate.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_start = start

    if best_ratio >= threshold:
        return (best_start, best_start + quote_len)

    return None  # Drop highlight rather than show wrong one
```

### Pattern 4: Multipart Form Endpoint
**What:** Single endpoint accepting both files and text fields
**When to use:** POST /api/grade route

```python
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException

router = APIRouter(tags=["grading"])

@router.post("/grade")
async def grade_essay(
    essay_text: str | None = Form(None),
    essay_file: UploadFile | None = File(None),
    rubric_text: str | None = Form(None),
    rubric_file: UploadFile | None = File(None),
    grade_level: str = Form("college"),
    user: User = Depends(get_current_user),
):
    # Validate: must have essay_text or essay_file
    if not essay_text and not essay_file:
        raise HTTPException(422, "Either essay_text or essay_file is required")

    # Extract text from PDF if file provided
    if essay_file:
        essay_text = await extract_pdf_text(essay_file)
    if rubric_file:
        rubric_text = await extract_pdf_text(rubric_file)

    # Grade
    result = await grading_service.grade(essay_text, rubric_text, grade_level)
    return result
```

### Anti-Patterns to Avoid
- **Synchronous LLM calls:** Never use requests or synchronous SDK clients; inference can take 30-120s and would block the event loop
- **Hardcoded provider logic:** Don't put provider-specific code in the route handler; use the adapter pattern
- **Retrying semantic failures:** Only retry on connection/timeout errors or malformed JSON; don't retry because the grading "seems wrong"
- **Trusting LLM character offsets:** Never ask the LLM to compute character offsets directly; LLMs cannot count characters reliably

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | pypdf PdfReader | PDF format is complex; pypdf handles encodings, fonts, layouts |
| JSON schema from Pydantic | Manual dict construction | `Model.model_json_schema()` | Automatic, always in sync with model |
| HTTP async client | aiohttp or urllib | httpx.AsyncClient | Already in project, clean API, timeout controls |
| Provider API auth | Manual header management | Official SDKs (anthropic, openai) | Handle auth, retries, rate limits properly |
| camelCase serialization | Custom field mapping | CamelModel (existing base class) | Already established pattern in project |

**Key insight:** The temptation is to build a "universal" HTTP client for all providers. Don't -- use official SDKs for Anthropic and OpenAI (they handle auth, retries, error types) and httpx only for Ollama (which has no official async Python SDK for the OpenAI-compat endpoint).

## Common Pitfalls

### Pitfall 1: LLM Returns Invalid JSON Despite Format Constraints
**What goes wrong:** Even with format=json or response_format=json_object, the LLM may return valid JSON that doesn't match the expected schema (missing fields, wrong types, extra fields).
**Why it happens:** JSON mode guarantees syntactically valid JSON, not schema compliance. Smaller models (3B params) are especially prone to schema drift.
**How to avoid:** Validate with Pydantic (`GradingResult.model_validate_json(raw_json)`). On validation error, retry once with a correction prompt that includes the validation error message. If retry also fails, return 502 with clear error.
**Warning signs:** Tests pass with large models but fail with small local models.

### Pitfall 2: Highlight Quotes Don't Match Essay Text
**What goes wrong:** LLM paraphrases or slightly modifies the quoted text, making exact matching fail.
**Why it happens:** LLMs don't copy text verbatim; they reconstruct from context. Smaller models are worse at exact quoting.
**How to avoid:** Use fuzzy matching as fallback. Set a reasonable threshold (0.6-0.7). Drop highlights below threshold rather than showing wrong ones. Instruct LLM explicitly: "Quote EXACTLY from the essay, character-for-character."
**Warning signs:** Many highlights returning None/empty in testing.

### Pitfall 3: Blocking Event Loop During Inference
**What goes wrong:** Using synchronous HTTP calls or CPU-bound fuzzy matching blocks FastAPI's async event loop.
**Why it happens:** Easy to accidentally use sync httpx or sync SDK methods.
**How to avoid:** Always use `await` with async clients. For fuzzy matching, difflib is fast enough for essay-length texts (< 10k chars); no need for threading.
**Warning signs:** Other API endpoints become unresponsive during grading.

### Pitfall 4: Timeout Too Short for Local Inference
**What goes wrong:** Ollama with 3B model on CPU can take 60-120 seconds for a full grading response with 4+ categories.
**Why it happens:** Default httpx timeout is 5 seconds. Default FastAPI/Uvicorn has no request timeout but httpx will fail.
**How to avoid:** Set httpx timeout to 120 seconds for read, 10 seconds for connect. Document that GPU inference is much faster.
**Warning signs:** Consistent timeout errors with local Ollama.

### Pitfall 5: Multipart Form Data Content-Type Conflicts
**What goes wrong:** Endpoint can't accept both JSON body and file upload simultaneously.
**Why it happens:** multipart/form-data and application/json are different content types; FastAPI can't mix Body() and File() in the same endpoint.
**How to avoid:** Use Form() fields for text parameters alongside File() for uploads. All parameters come as form data when files are present. The frontend will need to use FormData instead of JSON body.
**Warning signs:** 422 validation errors on requests with files.

### Pitfall 6: PDF Text Extraction Returns Garbage
**What goes wrong:** Scanned PDFs or image-based PDFs return empty or garbled text.
**Why it happens:** pypdf extracts embedded text only; it cannot OCR images.
**How to avoid:** Check extracted text length (< 50 chars threshold per CONTEXT.md decision). Return 422 with helpful message suggesting the user paste text instead.
**Warning signs:** Empty or very short extracted text from valid-looking PDFs.

## Code Examples

### PDF Text Extraction with pypdf
```python
# Source: pypdf official docs (https://pypdf.readthedocs.io/en/stable/user/extract-text.html)
from pypdf import PdfReader
from fastapi import UploadFile, HTTPException
import io

async def extract_pdf_text(file: UploadFile) -> str:
    # Check file size (10 MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "PDF file exceeds 10 MB limit")

    reader = PdfReader(io.BytesIO(contents))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text.strip())

    full_text = "\n\n".join(text_parts).strip()

    if len(full_text) < 50:
        raise HTTPException(
            422,
            "Could not extract sufficient text from PDF. "
            "The file may be scanned or image-based. "
            "Please paste the text directly instead."
        )

    return full_text
```

### Settings Configuration
```python
# Add to backend/app/config.py
from typing import Literal

class Settings(BaseSettings):
    # ... existing fields ...

    # LLM Configuration
    model_provider: Literal["ollama", "anthropic", "openai"] = "ollama"
    model_name: str = "llama3.2:3b"
    model_endpoint: str = "http://localhost:11434"

    # Provider API keys (optional, only needed for cloud providers)
    anthropic_api_key: str = ""
    openai_api_key: str = ""
```

### Grading Service Orchestration
```python
import json
import uuid
from datetime import datetime, timezone

from app.schemas.grading import GradingResult, CategoryScore, HighlightRange

class GradingService:
    def __init__(self, llm_client: LLMClient):
        self._llm = llm_client

    async def grade(
        self, essay_text: str, rubric_text: str | None, grade_level: str
    ) -> GradingResult:
        system_prompt = build_system_prompt(grade_level, rubric_text)
        user_prompt = build_user_prompt(essay_text)
        schema = build_grading_schema()

        raw_json = await self._llm.complete(system_prompt, user_prompt, schema)

        # Validate LLM output
        try:
            llm_output = json.loads(raw_json)
        except json.JSONDecodeError:
            # Retry once
            raw_json = await self._llm.complete(system_prompt, user_prompt, schema)
            llm_output = json.loads(raw_json)  # Let it raise if still invalid

        # Build GradingResult with computed highlights
        result = build_grading_result(llm_output, essay_text)
        return result
```

### Prompt Template Structure
```python
def build_system_prompt(grade_level: str, rubric_text: str | None) -> str:
    rubric_section = rubric_text if rubric_text else DEFAULT_RUBRIC

    return f"""You are an expert essay grader. Grade the following essay according to the rubric provided.

GRADE LEVEL CONTEXT: This essay was written by a {grade_level} student. Adjust your scoring expectations accordingly:
- For younger students, be more lenient on vocabulary complexity and citation formality
- For college/graduate level, expect sophisticated argumentation and proper citations

RUBRIC:
{rubric_section}

RESPONSE FORMAT:
You must respond with a JSON object containing:
- "categories": array of category objects, each with:
  - "name": category name from the rubric
  - "score": numeric score (float)
  - "maxScore": maximum possible score (float)
  - "strengths": array of strength descriptions (strings)
  - "improvements": array of improvement suggestions (strings)
  - "justification": detailed explanation of the score
  - "quotes": array of objects with "text" (exact quote from essay) and "type" ("strength" or "improvement") and "feedback" (brief explanation)
- "summary": overall assessment paragraph
- "overallScore": sum of category scores (float)
- "maxScore": sum of max scores (float)

CRITICAL: In the "quotes" array, you MUST quote EXACTLY from the essay text, character-for-character. Do not paraphrase or modify the quoted text in any way."""
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PyMuPDF for PDF parsing | pypdf (BSD licensed) | 2023+ | Avoids AGPL license concerns |
| fuzzywuzzy for fuzzy matching | rapidfuzz (MIT, C++ backed) | 2020+ | 10-100x faster, maintained |
| Manual JSON parsing from LLM | Provider-native JSON modes | 2024 | Syntactically valid JSON guaranteed |
| Anthropic beta structured outputs | GA structured outputs (output_config) | Late 2025 | No beta headers needed anymore |
| openai response_format json_object | openai structured outputs with json_schema | 2024 | Schema-level compliance (but json_object still works) |

**Deprecated/outdated:**
- PyPDF2: Merged back into pypdf; use pypdf directly
- fuzzywuzzy: Unmaintained; use rapidfuzz if needed
- Anthropic `output_format` parameter: Moved to `output_config.format`; old param still works during transition

## Open Questions

1. **Exact prompt wording for reliable structured output with Llama 3.2 3B**
   - What we know: Smaller models are worse at following complex JSON schemas. JSON mode helps with syntax but not semantics.
   - What's unclear: How reliably Llama 3.2 3B produces all required fields in the correct format. May need simplified schema.
   - Recommendation: Start with full schema, test iteratively, simplify if needed. Consider the LLM producing a slightly different internal format that gets mapped to GradingResult.

2. **Optimal fuzzy matching threshold**
   - What we know: Too low = wrong highlights shown; too high = too many highlights dropped.
   - What's unclear: The sweet spot for essay grading quotes.
   - Recommendation: Start with 0.6 threshold, tune based on testing. Log match ratios during development for calibration.

3. **Should Ollama use native API or OpenAI-compat endpoint?**
   - What we know: CONTEXT.md says "OpenAI-compatible /v1/chat/completions endpoint." Native Ollama API has `format` param that accepts full JSON schema (more powerful than json_object mode).
   - What's unclear: Whether OpenAI-compat endpoint supports response_format with json_schema or only json_object.
   - Recommendation: Use OpenAI-compat endpoint per user decision. If json_object mode proves insufficient, can switch to native Ollama API via httpx with format=schema.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio (already configured) |
| Config file | backend/pyproject.toml (asyncio_mode = "auto") |
| Quick run command | `cd backend && python -m pytest tests/test_grading.py -x` |
| Full suite command | `cd backend && python -m pytest tests/ -x` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRADE-01 | POST /api/grade returns GradingResult JSON | integration | `pytest tests/test_grading.py::test_grade_essay_returns_full_result -x` | No -- Wave 0 |
| GRADE-02 | Response includes valid character-offset highlights | unit | `pytest tests/test_highlights.py::test_highlight_offset_computation -x` | No -- Wave 0 |
| GRADE-03 | Different grade levels produce different scoring | integration | `pytest tests/test_grading.py::test_grade_level_affects_prompt -x` | No -- Wave 0 |
| GRADE-04 | MODEL_ENDPOINT env var switches inference host | unit | `pytest tests/test_llm_client.py::test_provider_factory -x` | No -- Wave 0 |
| PDF-01 | Backend extracts text from PDF via pypdf | unit | `pytest tests/test_pdf.py::test_extract_pdf_text -x` | No -- Wave 0 |
| PDF-02 | Endpoint accepts PDF upload and text, producing equivalent results | integration | `pytest tests/test_grading.py::test_grade_with_pdf_upload -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && python -m pytest tests/test_grading.py tests/test_highlights.py tests/test_pdf.py tests/test_llm_client.py -x`
- **Per wave merge:** `cd backend && python -m pytest tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_grading.py` -- integration tests for POST /api/grade with mocked LLM client
- [ ] `tests/test_highlights.py` -- unit tests for quote-to-offset matching logic
- [ ] `tests/test_pdf.py` -- unit tests for PDF text extraction (with sample PDF fixture)
- [ ] `tests/test_llm_client.py` -- unit tests for provider factory and client initialization
- [ ] `tests/conftest.py` -- add fixtures for mocked LLM client, sample essay text, sample PDF bytes

**Testing strategy note:** Integration tests for grading MUST mock the LLM client (not call real inference). Use a mock that returns known JSON to test the full pipeline: validation, highlight computation, response shape. This keeps tests fast and deterministic.

## Sources

### Primary (HIGH confidence)
- [pypdf docs](https://pypdf.readthedocs.io/en/stable/user/extract-text.html) - Text extraction API, PdfReader usage
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - tool_use schema, output_config, GA status, supported models
- [Ollama structured outputs blog](https://ollama.com/blog/structured-outputs) - format param with JSON schema, OpenAI-compat endpoint
- [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) - response_format json_object, Pydantic parse method
- [httpx timeouts](https://www.python-httpx.org/advanced/timeouts/) - Granular timeout configuration (connect/read/write/pool)
- [Python difflib](https://docs.python.org/3/library/difflib.html) - SequenceMatcher API

### Secondary (MEDIUM confidence)
- [Ollama OpenAI compatibility docs](https://docs.ollama.com/api/openai-compatibility) - Endpoint compatibility details
- [RapidFuzz GitHub](https://github.com/rapidfuzz/RapidFuzz) - partial_ratio for substring matching

### Tertiary (LOW confidence)
- Exact Llama 3.2 3B structured output reliability -- needs empirical testing during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are well-documented, official SDKs with async support
- Architecture: HIGH - Provider adapter pattern is well-established; project conventions are clear
- Pitfalls: MEDIUM-HIGH - Based on common LLM integration issues; threshold tuning needs empirical validation
- Highlight matching: MEDIUM - Algorithm is sound but threshold/reliability with small models is uncertain

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days; stable libraries, low churn)
