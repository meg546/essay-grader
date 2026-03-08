# UX Redesign: Inline Results, Free-Form Rubric, Profile System

**Date:** 2026-03-08
**Status:** Approved

## Summary

Simplify the app from 4 routes to 3. Remove the standalone results page — results display inline on the grade page after submission. Replace the manual rubric category editor with PDF upload (or no rubric, letting AI use grade level from profile). Add a skeletal profile system with email sign-in, grade level setting, and grading history. Add a basic home page.

## 1. Grade Page — Inline Results

Single `/grade` page with two states:

- **Input state:** Essay input (text/PDF upload) + rubric upload zone + submit button
- **Results state:** Scores, summary, per-category feedback (reuses existing results components). "Grade Another" button resets to input state.

No navigation away from the page. No `/results/:id` route.

## 2. Rubric Input Redesign

Replace the manual category editor with:

- **Upload zone:** PDF drag-and-drop upload for assignment rubrics. AI parses the PDF to extract grading criteria.
- **No rubric path:** If nothing uploaded, AI uses the student's grade level (from profile) to generate appropriate criteria and feedback.

Label: "Upload your assignment rubric (optional) — if none provided, we'll grade based on your grade level."

## 3. Skeletal Profile System

- **Route:** `/profile`
- **Email sign-in:** Text input, no password, no real auth. Stores in Zustand + localStorage.
- **Grade level:** Dropdown — Elementary / Middle School / High School / College.
- **Grading history:** Moved from `/history` into the profile page. Same history list, new location.
- **Persistence:** Profile data saved to localStorage so it survives refresh.

## 4. Navigation & Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/grade` | Essay input + rubric upload + inline results |
| `/profile` | Email, grade level, history |

Removed: `/results`, `/results/:id`, `/history`

Nav bar: **Home | Grade | Profile**

## 5. Home Page

- Headline with app name + one-liner ("AI-powered essay feedback in seconds")
- 2-3 sentence description of what the app does
- CTA button: "Grade an Essay" linking to `/grade`

Minimal — no feature grids or complex layout.

## Technical Notes

- Existing results components (ResultsSummary, ScoreOverview, CategoryFeedback) are reused inside GradingPage
- RubricEditor component replaced with a simpler RubricUpload component
- Profile store added to Zustand with localStorage persistence
- Mock grading API updated to accept optional rubric PDF and grade level
- All current rubric category management code (addCategory, removeCategory, etc.) removed from store
