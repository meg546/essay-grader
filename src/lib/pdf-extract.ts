import { getDocumentProxy } from "unpdf";

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));

  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    let pageText = "";
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!("str" in item)) continue;

      // transform[5] is the Y position (PDF coordinates, bottom-up)
      const y = item.transform[5];

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        // Y position changed — new line
        // Large gap suggests paragraph break, small gap is just a new line
        const gap = Math.abs(y - lastY);
        pageText += gap > item.height * 2.5 ? "\n\n" : "\n";
      } else if (lastY !== null && item.str !== "") {
        // Same line — add space between items if needed
        if (!pageText.endsWith(" ") && !item.str.startsWith(" ")) {
          pageText += " ";
        }
      }

      pageText += item.str;
      if (item.str !== "") lastY = y;
    }

    pageTexts.push(pageText.trim());
  }

  const fullText = pageTexts.join("\n\n").trim();
  return fullText.length === 0 ? "" : fullText.replace(/\n{3,}/g, "\n\n");
}
