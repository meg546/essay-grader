# EssayGrader

AI-powered essay grading application that provides detailed, rubric-aligned feedback with category scores, strengths/improvements, and highlighted essay passages.

## What It Does

Submit an essay (paste or upload .txt/.pdf), optionally attach a rubric PDF, and get back:

- **Overall score** with per-category breakdown (e.g., Thesis, Evidence, Organization)
- **Strengths and areas for improvement** for each category
- **Highlighted passages** in the essay linked to specific feedback
- **Tone-aware feedback** — choose Academic, Professional, Casual, or Creative tone
- **Grade level calibration** — Elementary through College

### Key Features

- **Grading toolbar** — vertical icon bar with rubric upload, essay upload, word stats, tone selector, grade level override, and clear with confirmation
- **Essays history** — card grid of all past submissions with score, date, and preview snippet
- **Essay detail view** — click any past essay to view full grading results (read-only)
- **Active draft indicator** — nav shows "Draft" when you have an essay in progress
- **User accounts** — registration with onboarding wizard, profile settings, password management
- **Rubric support** — upload PDF rubrics that get extracted and included in LLM grading context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Base UI) |
| State | Zustand (with localStorage persistence) |
| Routing | React Router v7 |
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude API (configurable — supports OpenAI too) |
| Auth | JWT tokens with Argon2 password hashing |
| Infra | Docker Compose |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An [Anthropic API key](https://console.anthropic.com/) (or OpenAI key)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/essay-grader.git
cd essay-grader
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/essaygrader
MODEL_PROVIDER=anthropic
MODEL_NAME=claude-haiku-4-5-20251001
ANTHROPIC_API_KEY=your-api-key-here
```

For OpenAI instead:
```env
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
OPENAI_API_KEY=your-openai-key-here
```

### 3. Start the application

```bash
docker compose up -d --build
```

This starts three services:
- **Frontend** — http://localhost:5173
- **Backend API** — http://localhost:8000
- **PostgreSQL** — localhost:5432

The database migrations run automatically on backend startup.

### 4. Use the app

1. Open http://localhost:5173
2. Register an account (completes onboarding wizard)
3. Paste or upload an essay
4. Optionally upload a rubric PDF and select tone/grade level
5. Click "Submit for Grading"
6. View detailed results with highlighted passages and category feedback

## Development

### Frontend (without Docker)

```bash
npm install
npm run dev
```

Requires Node.js 20.19+ or 22.12+.

### Backend (without Docker)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

### Database

```bash
# Run migrations
cd backend
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"
```

## Project Structure

```
essay-grader/
├── src/                    # React frontend
│   ├── api/                # API client functions
│   ├── components/         # UI components
│   │   ├── auth/           # Sign-in, register dialogs
│   │   ├── grading/        # Toolbar, modals, inputs
│   │   ├── layout/         # Header, protected routes
│   │   ├── results/        # Essay panel, feedback panel
│   │   └── ui/             # shadcn/ui primitives
│   ├── pages/              # Route pages
│   ├── stores/             # Zustand state management
│   └── lib/                # Utilities
├── backend/
│   └── app/
│       ├── llm/            # LLM client and prompt building
│       ├── models/         # SQLAlchemy models
│       ├── routes/         # FastAPI endpoints
│       ├── schemas/        # Pydantic schemas
│       └── services/       # Business logic
├── docker-compose.yml
├── Dockerfile.frontend
└── backend/Dockerfile
```

## License

MIT
