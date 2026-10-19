/**
 * Paragraph-aware chunker with overlap. Character-based (~4 chars per token),
 * so size=1000 is roughly 250 tokens. Good enough to start; swap for a
 * token-aware or semantic splitter once evals (Step 5) show it matters.
 */
export function chunkText(raw: string, size = 1000, overlap = 150): string[] {
  const text = raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return [];

  // 1) Break into pieces no longer than `size`.
  const pieces: string[] = [];
  for (const para of text.split(/\n\n+/)) {
    if (para.length <= size) { pieces.push(para); continue; }
    const sentences = para.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [para];
    for (const s of sentences) {
      if (s.length <= size) pieces.push(s.trim());
      else for (let i = 0; i < s.length; i += size - overlap) pieces.push(s.slice(i, i + size));
    }
  }

  // 2) Pack pieces into chunks, carrying a tail of the previous chunk as overlap.
  const chunks: string[] = [];
  let cur = "";
  for (const piece of pieces) {
    if (cur && cur.length + piece.length + 1 > size) {
      chunks.push(cur);
      cur = cur.slice(-overlap) + " " + piece;
    } else {
      cur = cur ? cur + "\n" + piece : piece;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}
