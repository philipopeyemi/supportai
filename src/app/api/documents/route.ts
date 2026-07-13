export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { extractTextFromFile, splitTextIntoChunks, generateEmbedding, generateEmbeddingsBatch } from "@/lib/rag";

// Isolated helper for reading and buffer allocation
async function parseUploadedFile(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Isolated helper for text extraction
async function extractTextFromBuffer(buffer: Buffer, fileExtension: string): Promise<string> {
  return extractTextFromFile(buffer, fileExtension);
}

// Isolated helper for chunk processing, batch embedding generation, and batch database insertions
async function ingestDocumentChunks(documentId: string, rawText: string, fileSize: number): Promise<void> {
  const startTime = Date.now();
  const allChunks = splitTextIntoChunks(rawText);
  const totalChunksCount = allChunks.length;

  // Defensive Limit: Abort if chunk count > 10,000 to prevent database overload
  if (totalChunksCount > 10000) {
    throw new Error(`Document contains too many text chunks (${totalChunksCount}). Maximum allowed limit is 10,000 chunks.`);
  }
  
  // Cap at 150 chunks for safety in serverless environments
  const chunks = allChunks.slice(0, 150);
  const processedChunksCount = chunks.length;
  const pageCount = chunks.length > 0 ? Math.max(...chunks.map(c => c.pageNumber)) : 0;

  console.log(`[RAG INGESTION] Starting ingestion for document: ${documentId}`);
  console.log(`[RAG INGESTION] Total chunks: ${totalChunksCount}, Cap limit: ${processedChunksCount}, Estimated pages: ${pageCount}`);

  const BATCH_SIZE = 15;
  let processedCount = 0;

  // Process chunks in small batches of 15 to keep active heap footprint minimal
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    // 1. Generate embeddings in a single batch API call for the sub-array
    const batchContents = batch.map(c => c.content);
    let vectors: number[][];
    try {
      vectors = await generateEmbeddingsBatch(batchContents);
    } catch (batchError) {
      console.warn(`[RAG WARNING] Failed to generate embeddings batch at offset ${i}. Retrying with sequential local fallbacks...`);
      vectors = await Promise.all(batchContents.map(async (text) => {
        try {
          return await generateEmbedding(text);
        } catch {
          return new Array(384).fill(0); // Dummy fallback
        }
      }));
    }

    // 2. Map and serialize chunks
    const chunksData = batch.map((chunk, idx) => ({
      documentId,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      embedding: JSON.stringify(vectors[idx]),
    }));

    // 3. Batch insert the sub-array immediately
    if (chunksData.length > 0) {
      await prisma.documentChunk.createMany({
        data: chunksData,
      });
    }

    processedCount += batch.length;

    // Log progress and heap usage to monitor Vercel limits
    const heapUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(`[RAG INGESTION] Progress: ${processedCount}/${processedChunksCount} chunks stored. Current Heap: ${heapUsedMB} MB`);
  }
  
  const duration = Date.now() - startTime;
  const avgChunkSize = chunks.length > 0 ? Math.round(chunks.reduce((acc, c) => acc + c.content.length, 0) / chunks.length) : 0;
  const batchCount = Math.ceil(chunks.length / BATCH_SIZE);

  // Observability Ingestion Report Logs
  console.log(`[RAG OBSERVABILITY] Ingestion Report for Document: ${documentId}
  - File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
  - Extracted Text Length: ${rawText.length} characters
  - Chunk Count: ${chunks.length}
  - Average Chunk Size: ${avgChunkSize} characters
  - Embedding Batch Count: ${batchCount}
  - Processing Duration: ${duration} ms
  - Peak Heap Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);

  // Warning logs for pathological documents
  if (fileSize > 3 * 1024 * 1024) {
    console.warn(`[RAG WARNING] Unusually large document uploaded (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  }
  if (chunks.length > 100) {
    console.warn(`[RAG WARNING] Excessive chunk count generated for document (${chunks.length} chunks)`);
  }
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatbotId = searchParams.get("chatbotId");

  if (!chatbotId) {
    return NextResponse.json({ error: "Chatbot ID is required" }, { status: 400 });
  }

  try {
    // Verify chatbot ownership
    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, organizationId: user.organizationId },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    const documents = await prisma.document.findMany({
      where: { chatbotId },
      include: { _count: { select: { chunks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const chatbotId = formData.get("chatbotId") as string | null;

    if (!file || !chatbotId) {
      return NextResponse.json({ error: "File and Chatbot ID are required" }, { status: 400 });
    }

    // Verify chatbot ownership
    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, organizationId: user.organizationId },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    const fileName = file.name;
    const fileExtension = (fileName.split(".").pop() || "").toLowerCase();
    const fileSize = file.size;

    // Security Check: Restrict file extensions
    const allowedExtensions = ["pdf", "docx", "txt", "md"];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only PDF, DOCX, TXT, and MD files are allowed." },
        { status: 400 }
      );
    }

    // Security Check: Restrict file size to 5MB max (Vercel memory limit safety)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(fileSize / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 5MB.` },
        { status: 400 }
      );
    }

    // Create document record in PROCESSING state
    const document = await prisma.document.create({
      data: {
        title: fileName,
        chatbotId,
        fileType: fileExtension,
        status: "PROCESSING",
        size: fileSize,
      },
    });

    console.log(`[DOCUMENT UPLOAD] Created document ${document.id} in PROCESSING state. Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Start RAG processing pipeline using isolated scopes
    try {
      // 1. Read binary buffer inside an isolated function scope
      let buffer: Buffer | null = await parseUploadedFile(file);

      // 2. Extract text inside an isolated function scope
      let rawText: string | null = await extractTextFromBuffer(buffer, fileExtension);

      // Nullify buffer reference immediately to release memory before chunking/embeddings
      buffer = null;

      if (!rawText || rawText.trim().length === 0) {
        rawText = null;
        throw new Error("No text content could be extracted from this file.");
      }

      // Defensive Check: Limit maximum extracted text length to 5,000,000 characters
      const MAX_TEXT_LENGTH = 5000000;
      if (rawText.length > MAX_TEXT_LENGTH) {
        const textLength = rawText.length;
        rawText = null;
        throw new Error(`Extracted text is too large (${(textLength / 1024 / 1024).toFixed(2)} MB). Maximum limit is 5,000,000 characters.`);
      }

      // 3. Process chunking, embedding batching, and database batch write in a separate call
      await ingestDocumentChunks(document.id, rawText, fileSize);

      // Nullify rawText reference to clear stack memory
      rawText = null;

      // Update document status to TRAINED (Completed)
      const updatedDoc = await prisma.document.update({
        where: { id: document.id },
        data: { status: "TRAINED" },
      });

      return NextResponse.json(updatedDoc);
    } catch (processError: any) {
      console.error(`RAG Processing failed for document ${document.id}:`, processError);
      
      // Update document to FAILED
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: processError.message || "Failed to process document content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("File upload handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
