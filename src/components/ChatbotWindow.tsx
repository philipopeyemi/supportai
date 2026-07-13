"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowRight, MessageSquare, ShieldAlert, FileText } from "lucide-react";

interface Chatbot {
  id: string;
  name: string;
  themeColor: string;
  greetingMessage: string;
  suggestions: string; // JSON stringified array
}

interface Message {
  id: string;
  sender: "USER" | "AI" | "AGENT";
  content: string;
  sources?: { documentTitle: string; pageNumber: number }[];
}

export default function ChatbotWindow({ chatbot }: { chatbot: Chatbot }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      sender: "AI",
      content: chatbot.greetingMessage,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId] = useState(() => `visitor_${Math.random().toString(36).substring(2, 11)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse suggestions
  let suggestionsList: string[] = [];
  try {
    suggestionsList = JSON.parse(chatbot.suggestions);
  } catch (e) {
    suggestionsList = ["What is SupportIQ AI?", "How do I upload documents?"];
  }

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Post color theme to parent widget window
  useEffect(() => {
    if (window.parent) {
      window.parent.postMessage(
        { type: "supportiq-theme", color: chatbot.themeColor },
        "*"
      );
    }
  }, [chatbot.themeColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await handleSend(input.trim());
  };

  const handleSend = async (text: string) => {
    setInput("");
    setIsLoading(true);

    const userMessageId = `user_${Date.now()}`;
    const aiMessageId = `ai_${Date.now()}`;

    // Add User message
    const newMessages: Message[] = [
      ...messages,
      { id: userMessageId, sender: "USER", content: text },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          message: text,
          conversationId,
          visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      // Stream Reader
      const reader = response.body?.getReader();
      const encoder = new TextDecoder();
      if (!reader) throw new Error("No response body stream");

      // Setup blank AI message
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, sender: "AI", content: "" },
      ]);

      let streamedText = "";
      let citations: { documentTitle: string; pageNumber: number }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = encoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("t:")) {
            streamedText += line.substring(2);
            // Update the streaming AI message text
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, content: streamedText } : msg
              )
            );
          } else if (line.startsWith("c:")) {
            try {
              citations = JSON.parse(line.substring(2));
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, sources: citations } : msg
                )
              );
            } catch (e) {
              console.error("Citations parsing error:", e);
            }
          }
        }
      }

      // Check if we received conversation headers or need to fetch details
      // Simple lookup to set conversation id if we haven't yet
      if (!conversationId) {
        // If we don't have conversation ID, fetch latest thread info to sync session
        const convResp = await fetch(`/api/conversations?chatbotId=${chatbot.id}`);
        if (convResp.ok) {
          const convList = await convResp.json();
          const activeThread = convList.find((c: any) => c.visitorId === visitorId);
          if (activeThread) {
            setConversationId(activeThread.id);
          }
        }
      }

    } catch (error) {
      console.error("Error chatting:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          sender: "AI",
          content: "❌ I encountered a connection issue. Let me notify a support team member to assist you.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 border-t-4" style={{ borderTopColor: chatbot.themeColor }}>
      {/* Header Bar */}
      <div 
        className="flex items-center gap-3 p-4 text-white shadow-sm shrink-0"
        style={{ backgroundColor: chatbot.themeColor }}
      >
        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold leading-tight">{chatbot.name}</h2>
          <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Support Active
          </p>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => {
          const isAI = msg.sender === "AI" || msg.sender === "AGENT";
          return (
            <div 
              key={msg.id}
              className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
            >
              {/* Sender Tag */}
              <span className="text-[10px] text-slate-400 mb-1 px-1">
                {msg.sender === "AGENT" ? "💁‍♂️ Representative" : msg.sender === "AI" ? chatbot.name : "You"}
              </span>

              {/* Message Bubble */}
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap ${
                  isAI
                    ? msg.sender === "AGENT"
                      ? "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm"
                      : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                    : "text-white rounded-tr-sm"
                }`}
                style={!isAI ? { backgroundColor: chatbot.themeColor } : {}}
              >
                {msg.content}
                
                {/* Citations Indicator */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((source, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium"
                          title={source.documentTitle}
                        >
                          {source.documentTitle.length > 18 ? source.documentTitle.substring(0, 15) + '...' : source.documentTitle} (p. {source.pageNumber})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-400 mb-1 px-1">{chatbot.name}</span>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100 flex gap-1 shadow-sm">
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only shows if conversation is brand new and not loading) */}
      {messages.length === 1 && !isLoading && suggestionsList.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-1 shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Suggested Questions</p>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
            {suggestionsList.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sug)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 text-left transition"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-full w-9 h-9 flex items-center justify-center text-white transition disabled:opacity-50 shrink-0"
          style={{ backgroundColor: chatbot.themeColor }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Branding footer */}
      <div className="py-1.5 bg-white border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 shrink-0">
        Powered by <strong className="font-semibold text-slate-500">SupportIQ AI</strong>
      </div>
    </div>
  );
}
