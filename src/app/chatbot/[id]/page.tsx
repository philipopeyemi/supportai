import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ChatbotWindow from "@/components/ChatbotWindow";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  if (!chatbot) {
    return {
      title: "Chatbot Not Found - SupportIQ AI",
    };
  }

  return {
    title: `${chatbot.name} - SupportIQ AI`,
  };
}

export default async function ChatbotPage({ params }: PageProps) {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: params.id },
  });

  if (!chatbot) {
    notFound();
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <ChatbotWindow chatbot={chatbot} />
    </div>
  );
}
