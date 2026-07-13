export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatbotId = params.id;

  try {
    // Verify chatbot belongs to user's organization
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        id: chatbotId,
        organizationId: user.organizationId,
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    const { name, instructions, greetingMessage, themeColor, suggestions } = await req.json();

    const updatedChatbot = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: {
        name: name !== undefined ? name : chatbot.name,
        instructions: instructions !== undefined ? instructions : chatbot.instructions,
        greetingMessage: greetingMessage !== undefined ? greetingMessage : chatbot.greetingMessage,
        themeColor: themeColor !== undefined ? themeColor : chatbot.themeColor,
        suggestions: suggestions !== undefined ? suggestions : chatbot.suggestions,
      },
    });

    return NextResponse.json(updatedChatbot);
  } catch (error) {
    console.error("Error updating chatbot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatbotId = params.id;

  try {
    // Verify chatbot belongs to user's organization
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        id: chatbotId,
        organizationId: user.organizationId,
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found or access denied" }, { status: 404 });
    }

    await prisma.chatbot.delete({
      where: { id: chatbotId },
    });

    return NextResponse.json({ success: true, message: "Chatbot deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
