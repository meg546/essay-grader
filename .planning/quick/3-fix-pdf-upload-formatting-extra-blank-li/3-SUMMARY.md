# Quick Task 3: Fix PDF Upload Formatting

**Status:** Complete
**Date:** 2026-03-10
**Commit:** 89ee416

## Problem

PDF uploads produced text with a blank line between every line, destroying paragraph structure. The title was also merged into the first paragraph.

## Root Cause

The original `pdf-extract.ts` used `item.height * 1.5` as a paragraph threshold, but PDF line spacing (~1.2x font height) often exceeded this, causing every line to get `\n\n`. The approach of comparing individual gaps to font height was unreliable.

## Solution

Rewrote `src/lib/pdf-extract.ts` with a two-pass approach:

1. **Group items into lines** by Y position instead of processing items individually
2. **Median gap detection** — compute the median Y-gap between all lines to determine normal line spacing, then use 1.4x median as the paragraph threshold
3. **Short line detection** — lines shorter than 50% of the 75th percentile length (titles/headings) get a paragraph break after them
4. **Re-flow body text** — normal line breaks become spaces, only paragraph breaks and short lines produce `\n\n`
5. **Smart page joining** — pages ending mid-sentence join with a space; pages ending with punctuation get a paragraph break

## Files Changed

- `src/lib/pdf-extract.ts` — Complete rewrite of extraction logic (74 insertions, 15 deletions)
