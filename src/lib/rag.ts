import { PdfReader } from "pdfreader";
import mammoth from "mammoth";

// 1. TEXT EXTRACTORS
export async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  const type = fileType.toLowerCase();
  
  if (type === "txt" || type === "md" || type === "markdown") {
    return buffer.toString("utf-8");
  }
  
  if (type === "pdf") {
    try {
      return new Promise<string>((resolve, reject) => {
        let text = "";
        let page = 1;
        new PdfReader({}).parseBuffer(buffer, (err: any, item: any) => {
          if (err) {
            console.error("PdfReader error:", err);
            reject(new Error("Failed to extract text from PDF document"));
          } else if (!item) {
            resolve(text);
          } else if (item.text) {
            text += item.text + " ";
          } else if (item.page) {
            text += `\n[Page ${page}]\n`;
            page++;
          }
        });
      });
    } catch (error) {
      console.error("Error parsing PDF with pdfreader:", error);
      throw new Error("Failed to extract text from PDF document");
    }
  }
  
  if (type === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw new Error("Failed to extract text from DOCX document");
    }
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
}

// 2. RECURSIVE TEXT SPLITTER
interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export function splitTextIntoChunks(text: string, options: ChunkOptions = {}): { content: string; pageNumber: number }[] {
  const chunkSize = options.chunkSize || 800;
  const chunkOverlap = options.chunkOverlap || 150;
  
  // Clean text a bit
  const cleanedText = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  
  const chunks: { content: string; pageNumber: number }[] = [];
  let currentIndex = 0;
  let pageCounter = 1;

  // Simple page detector based on form-feed characters or common page markers
  const pageBreaks = Array.from(cleanedText.matchAll(/\f|\[Page \d+\]/gi));
  
  function getPageNumber(charIndex: number): number {
    let page = 1;
    for (const pb of pageBreaks) {
      if (pb.index !== undefined && pb.index <= charIndex) {
        page++;
      } else {
        break;
      }
    }
    return page;
  }
  
  while (currentIndex < cleanedText.length) {
    let endIndex = currentIndex + chunkSize;
    
    if (endIndex >= cleanedText.length) {
      endIndex = cleanedText.length;
    } else {
      // Try to find a good breaking point (like double newline, newline, space)
      const subString = cleanedText.substring(currentIndex, endIndex + 100);
      const doubleNewlineIdx = subString.indexOf("\n\n", chunkSize - 100);
      const newlineIdx = subString.indexOf("\n", chunkSize - 100);
      const spaceIdx = subString.indexOf(" ", chunkSize - 50);
      
      if (doubleNewlineIdx !== -1 && doubleNewlineIdx < chunkSize + 100) {
        endIndex = currentIndex + doubleNewlineIdx;
      } else if (newlineIdx !== -1 && newlineIdx < chunkSize + 80) {
        endIndex = currentIndex + newlineIdx;
      } else if (spaceIdx !== -1 && spaceIdx < chunkSize + 50) {
        endIndex = currentIndex + spaceIdx;
      }
    }
    
    const chunkText = cleanedText.substring(currentIndex, endIndex).trim();
    if (chunkText.length > 10) {
      chunks.push({
        content: chunkText,
        pageNumber: getPageNumber(currentIndex),
      });
    }
    
    currentIndex = endIndex - chunkOverlap;
    if (currentIndex >= cleanedText.length - 50) break;
  }
  
  return chunks;
}

// 3. VECTOR EMBEDDINGS (Dual Mode: API / Deterministic Vector Space Hash)
const VECTOR_DIMENSION = 384;

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (apiKey && apiKey.trim() !== "") {
    try {
      // In production, we make a POST request to OpenRouter or Cohere/OpenAI.
      // E.g. using Cohere's embed model: "cohere/embed-english-v3.0"
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "cohere/embed-english-v3.0",
          input: [text],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].embedding) {
          return data.data[0].embedding;
        }
      }
      console.warn("Embeddings API request failed, falling back to simulated semantic vector.");
    } catch (e) {
      console.error("Error generating API embedding:", e);
    }
  }
  
  // Local fallback
  return generateLocalEmbedding(text);
}

// Local fallback execution logic (decoupled for batch calls)
function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);
    
  if (words.length === 0) {
    vector[0] = 1.0;
    return vector;
  }
  
  const hashString = (str: string): number => {
    let hash = 17;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  };
  
  for (const word of words) {
    const idx1 = hashString(word) % VECTOR_DIMENSION;
    const idx2 = hashString(word + "_2") % VECTOR_DIMENSION;
    vector[idx1] += 1.0;
    vector[idx2] += 0.5;
  }
  
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] /= norm;
    }
  } else {
    vector[0] = 1.0;
  }
  return vector;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (apiKey && apiKey.trim() !== "") {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "cohere/embed-english-v3.0",
          input: texts,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // OpenRouter/OpenAI return format matches [{ embedding: [...] }, ...]
          return data.data.map((item: any) => item.embedding);
        }
      }
      console.warn("Batch embeddings API request failed, falling back to local vectorizer.");
    } catch (e) {
      console.error("Error generating API embeddings batch:", e);
    }
  }
  
  // Fallback to local vectorizer for each chunk
  return texts.map(text => generateLocalEmbedding(text));
}

// 4. COSINE SIMILARITY ENGINE
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 5. RETRIEVAL PIPELINE
export interface DocumentSource {
  documentTitle: string;
  pageNumber: number;
  content: string;
  score: number;
}

export function retrieveRelevantChunks(
  queryVector: number[],
  dbChunks: { content: string; pageNumber: number; embedding: string; document: { title: string } }[],
  topK = 4
): DocumentSource[] {
  const scoredChunks = dbChunks.map((chunk) => {
    let chunkVector: number[];
    try {
      chunkVector = JSON.parse(chunk.embedding);
    } catch (e) {
      chunkVector = new Array(VECTOR_DIMENSION).fill(0);
    }
    
    const score = cosineSimilarity(queryVector, chunkVector);
    return {
      documentTitle: chunk.document.title,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      score,
    };
  });
  
  // Sort descending by score, filter out very low similarity matches, and slice topK
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .filter(chunk => chunk.score > 0.05) // Threshold
    .slice(0, topK);
}
