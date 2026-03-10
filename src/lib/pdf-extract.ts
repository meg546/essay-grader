import { getDocumentProxy } from "unpdf";

interface TextLine {
  y: number;
  text: string;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));

  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items into lines by Y position
    const lines: TextLine[] = [];
    let currentLine: TextLine | null = null;

    for (const item of content.items) {
      if (!("str" in item)) continue;

      const y = item.transform[5];

      if (currentLine === null || Math.abs(y - currentLine.y) > 2) {
        // New line
        if (currentLine !== null) lines.push(currentLine);
        currentLine = { y, text: item.str };
      } else {
        // Same line — append with space if needed
        if (
          currentLine.text.length > 0 &&
          !currentLine.text.endsWith(" ") &&
          !item.str.startsWith(" ") &&
          item.str !== ""
        ) {
          currentLine.text += " ";
        }
        currentLine.text += item.str;
      }
    }
    if (currentLine !== null) lines.push(currentLine);

    // Compute Y-gaps between consecutive lines
    const gaps: number[] = [];
    for (let j = 1; j < lines.length; j++) {
      const gap = Math.abs(lines[j].y - lines[j - 1].y);
      if (gap > 2) gaps.push(gap);
    }
    gaps.sort((a, b) => a - b);
    const medianGap = gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 0;
    const paragraphThreshold = medianGap * 1.4;

    // Find the typical body line length to detect short lines (titles/headings)
    const lineLengths = lines.map((l) => l.text.trim().length).filter((len) => len > 0);
    lineLengths.sort((a, b) => a - b);
    const longLineLength =
      lineLengths.length > 0 ? lineLengths[Math.floor(lineLengths.length * 0.75)] : 0;

    // Build page text: re-flow body lines, break on paragraphs and after short lines
    let pageText = "";
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].text.trim();
      if (!line) continue;

      if (pageText.length > 0) {
        const gap = j > 0 ? Math.abs(lines[j].y - lines[j - 1].y) : 0;
        const prevLine = lines[j - 1]?.text.trim() ?? "";
        const prevIsShort = prevLine.length > 0 && prevLine.length < longLineLength * 0.5;

        if (
          (paragraphThreshold > 0 && gap > paragraphThreshold) ||
          prevIsShort
        ) {
          pageText += "\n\n";
        } else {
          if (!pageText.endsWith(" ") && !line.startsWith(" ")) {
            pageText += " ";
          }
        }
      }

      pageText += line;
    }

    pageTexts.push(pageText.trim());
  }

  // Join pages: if a page ends mid-sentence, continue with a space; otherwise paragraph break
  let fullText = "";
  for (let i = 0; i < pageTexts.length; i++) {
    if (i > 0 && fullText.length > 0) {
      const endsWithPunctuation = /[.!?:;")\]]\s*$/.test(fullText);
      fullText += endsWithPunctuation ? "\n\n" : " ";
    }
    fullText += pageTexts[i];
  }
  fullText = fullText.trim();
  return fullText.length === 0 ? "" : fullText.replace(/\n{3,}/g, "\n\n");
}
