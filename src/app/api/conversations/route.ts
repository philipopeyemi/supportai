export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

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

    const conversations = await prisma.conversation.findMany({
      where: { chatbotId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, status, rating } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Verify conversation belongs to chatbot owned by user's organization
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        chatbot: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: status !== undefined ? status : conversation.status,
        rating: rating !== undefined ? rating : conversation.rating,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json({ error: "Conversation ID and message content are required" }, { status: 400 });
    }

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        chatbot: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
    }

    // Save human agent response
    const agentMsg = await prisma.message.create({
      data: {
        conversationId,
        sender: "AGENT",
        content: message,
      },
    });

    // Make sure status is active or paused (takeover)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(agentMsg);
  } catch (error) {
    console.error("Error posting agent message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
