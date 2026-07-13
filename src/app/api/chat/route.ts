export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding, retrieveRelevantChunks } from "@/lib/rag";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const { chatbotId, message, conversationId, visitorId } = await req.json();

    if (!chatbotId || !message) {
      return NextResponse.json({ error: "Chatbot ID and message are required" }, { status: 400 });
    }

    // 1. Verify chatbot exists
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // 2. Resolve or Create Conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      const activeVisitorId = visitorId || `visitor_${Math.random().toString(36).substring(2, 11)}`;
      conversation = await prisma.conversation.create({
        data: {
          chatbotId,
          visitorId: activeVisitorId,
          status: "ACTIVE",
        },
      });
    }

    // Save the user's message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "USER",
        content: message,
      },
    });

    // Increment conversation metrics in analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.analytics.upsert({
      where: { id: `${chatbotId}_${today.getTime()}` }, // Use composite-like unique key
      create: {
        id: `${chatbotId}_${today.getTime()}`,
        chatbotId,
        date: today,
        conversationsCount: 1,
        messagesCount: 2, // User message + AI response
      },
      update: {
        messagesCount: { increment: 2 },
      },
    }).catch(err => console.error("Error updating daily analytics:", err));

    // 3. Vector Similarity Search (RAG)
    const queryVector = await generateEmbedding(message);
    const dbChunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          chatbotId,
          status: "TRAINED",
        },
      },
      include: {
        document: true,
      },
    });

    const relevantChunks = retrieveRelevantChunks(queryVector, dbChunks, 3);
    const citations = relevantChunks.map(chunk => ({
      documentTitle: chunk.documentTitle,
      pageNumber: chunk.pageNumber,
    }));

    // Fetch conversation history (last 8 messages for context)
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // 4. Construct AI System Context Prompt
    const contextText = relevantChunks.length > 0 
      ? relevantChunks.map((c, i) => `[Source ${i+1}: "${c.documentTitle}" (Page ${c.pageNumber})]\n${c.content}`).join("\n\n")
      : "No training documents uploaded or matching this query.";

    const systemPrompt = `You are a warm, highly professional, and natural customer support representative named "${chatbot.name}".
Your brand primary color is ${chatbot.themeColor}.
Instructions: ${chatbot.instructions}

Your role is to assist the user by answering their questions using the private knowledge base provided below. Speak naturally, empathetically, and conversationally, just like a knowledgeable and helpful human support agent.

Private Business Knowledge Base:
---
${contextText}
---

Rules of Engagement:
1. Speak Like a Human:
   - Use conversational transitions. Do NOT use robotic phrases like "Based on the provided context," "According to the document," "As an AI," or "As a language model."
   - Sound warm, polite, and helpful. Use phrases like "I'd be happy to help with that!", "Great question!", or "Let me get that information for you."
   - Adapt your tone dynamically. If the user seems frustrated, show empathy and patience.
2. Rely on Knowledge:
   - Answer the question accurately using the private business knowledge base above.
   - If the answer cannot be found in the knowledge base, do not make up facts or hallucinate details. Instead, respond naturally as a human representative: "I don't have the exact details on hand for that right now. Let me check with our team, or I can connect you directly with a member of our support staff. Would you like me to do that?"
3. Citations & References:
   - Reference facts naturally in your sentences (e.g., "According to our return policy," or "Our office is open from...").
   - Do NOT insert robotic bracketed citation tags (like "[Source 1]") directly in your visible response. Keep your output clean and let the system handle references separately.
4. Response Styling:
   - Keep answers clear, friendly, and structured. Use bullet points or small paragraphs if explaining steps.
   - Format using clean, standard Markdown (e.g., bolding key terms, lists).`;

    // 5. Streaming Response Generation
    const encoder = new TextEncoder();

    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim() !== "") {
      // Build LLM Chat payload
      const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...history.slice(0, -1).map(m => ({
          role: m.sender === "USER" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: message }
      ];

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://supportiq-ai.vercel.app",
            "X-Title": "SupportIQ AI Support Bot",
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: messagesPayload,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API responded with status ${response.status}`);
        }

        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            let fullAnswer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = new TextDecoder().decode(value);
                const lines = chunkText.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                  if (line.includes("[DONE]")) continue;
                  if (line.startsWith("data: ")) {
                    try {
                      const parsed = JSON.parse(line.substring(6));
                      const content = parsed.choices?.[0]?.delta?.content || "";
                      if (content) {
                        fullAnswer += content;
                        // Format chunk for client: prefix "t:" for text, "c:" for citations
                        controller.enqueue(encoder.encode(`t:${content}\n`));
                      }
                    } catch (e) {
                      // ignore parse errors
                    }
                  }
                }
              }

              // Send citations at the end
              if (citations.length > 0) {
                controller.enqueue(encoder.encode(`c:${JSON.stringify(citations)}\n`));
              }

              // Save the full answer to database
              await prisma.message.create({
                data: {
                  conversationId: conversation!.id,
                  sender: "AI",
                  content: fullAnswer,
                  sources: JSON.stringify(citations),
                },
              });
            } catch (err) {
              console.error("Error reading stream:", err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });

      } catch (apiError) {
        console.error("OpenRouter connection failed, triggering simulated streamer:", apiError);
      }
    }

    // SIMULATED RAG STREAMER (Fallback when offline / no API key)
    // Ranks documents, crafts response using matching chunk segments, and streams word-by-word.
    const stream = new ReadableStream({
      async start(controller) {
        let answer = "";
        
        if (relevantChunks.length > 0) {
          const mainSource = relevantChunks[0];
          answer = `Based on the trained document **${mainSource.documentTitle}** (Page ${mainSource.pageNumber}):\n\n`;
          
          // Split the matching chunk text into smaller digestable sentences
          const sentences = mainSource.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
          if (sentences.length > 0) {
            answer += `• ${sentences.slice(0, 3).join(". \n• ")}.\n\n`;
          } else {
            answer += `${mainSource.content}\n\n`;
          }
          
          answer += `Let me know if you need further assistance!`;
        } else {
          // Standard fallback when no context matches
          answer = `Hello! I am **${chatbot.name}**, your customer support assistant.\n\nI couldn't find any documents trained on this topic in our knowledge base.\n\nWould you like me to connect you with a **human agent**? I can pause our chat and notify the support team to review your request.`;
        }

        // Save the full answer to DB
        await prisma.message.create({
          data: {
            conversationId: conversation!.id,
            sender: "AI",
            content: answer,
            sources: JSON.stringify(citations),
          },
        });

        // Stream answer word-by-word
        const words = answer.split(" ");
        for (let i = 0; i < words.length; i++) {
          const space = i === words.length - 1 ? "" : " ";
          controller.enqueue(encoder.encode(`t:${words[i]}${space}\n`));
          // Wait 40ms to simulate typing effect
          await new Promise(resolve => setTimeout(resolve, 40));
        }

        // Stream citations
        if (citations.length > 0) {
          controller.enqueue(encoder.encode(`c:${JSON.stringify(citations)}\n`));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
