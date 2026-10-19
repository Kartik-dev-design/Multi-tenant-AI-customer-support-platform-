import fs from "fs/promises";
import pdf from "pdf-parse/lib/pdf-parse.js"; // import the lib file directly: the package index runs debug code

export async function extractText(path: string, mimeType: string, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (mimeType === "application/pdf" || ext === "pdf") {
    const data = await pdf(await fs.readFile(path));
    return data.text;
  }
  return fs.readFile(path, "utf8"); // txt, md
}
