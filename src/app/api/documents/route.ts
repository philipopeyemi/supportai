export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { extractTextFromFile, splitTextIntoChunks, generateEmbedding } from "@/lib/rag";

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

    // Security Check: Restrict file size to 10MB max
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size boundary of 10MB." },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create document record in PENDING state
    const document = await prisma.document.create({
      data: {
        title: fileName,
        chatbotId,
        fileType: fileExtension,
        status: "PROCESSING",
        size: fileSize,
      },
    });

    // Start RAG processing
    try {
      // 1. Extract text
      const rawText = await extractTextFromFile(buffer, fileExtension);
      if (!rawText || rawText.trim().length === 0) {
        throw new Error("No text content could be extracted from this file.");
      }

      // 2. Chunk text and limit to a maximum of 150 chunks for safety
      const allChunks = splitTextIntoChunks(rawText);
      const chunks = allChunks.slice(0, 150);

      // 3. Generate embeddings in memory
      const chunksData = [];
      for (const chunk of chunks) {
        const vector = await generateEmbedding(chunk.content);
        chunksData.push({
          documentId: document.id,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          embedding: JSON.stringify(vector),
        });
      }

      // 4. Batch insert all chunks in a single query
      if (chunksData.length > 0) {
        await prisma.documentChunk.createMany({
          data: chunksData,
        });
      }

      // Update document to TRAINED
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
