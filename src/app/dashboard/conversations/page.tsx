"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { 
  MessageSquare, User, Bot, Send, RefreshCw, Eye, Pause, Play, CheckCircle
} from "lucide-react";

interface Message {
  id: string;
  sender: "USER" | "AI" | "AGENT";
  content: string;
  createdAt: string;
  sources?: string | null;
}

interface Conversation {
  id: string;
  visitorId: string;
  status: string; // "ACTIVE" | "CLOSED" | "PAUSED"
  updatedAt: string;
  messages: Message[];
  rating?: number | null;
}

export default function ConversationsPage() {
  const { activeChatbot } = useDashboard();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async (silent = false) => {
    if (!activeChatbot) return;
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations?chatbotId=${activeChatbot.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    setSelectedId(null);
  }, [activeChatbot]);

  const activeThread = conversations.find(c => c.id === selectedId);

  // Auto scroll to bottom of active message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      const response = await fetch("/api/conversations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, status: newStatus }),
      });

      if (response.ok) {
        // Optimistically update
        setConversations(prev =>
          prev.map(c => c.id === selectedId ? { ...c, status: newStatus } : c)
        );
      }
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedId || isSending) return;
    setIsSending(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          message: replyText.trim(),
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setReplyText("");
        
        // Update local thread
        setConversations(prev =>
          prev.map(c => {
            if (c.id === selectedId) {
              return {
                ...c,
                messages: [...c.messages, newMsg],
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Error posting response:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations(true);
    setIsRefreshing(false);
  };

  if (!activeChatbot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-slate-200 rounded-2xl p-8">
        <MessageSquare className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold font-outfit text-slate-800">No AI agent active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Create a chatbot from the dropdown selector on the sidebar to check customer chats.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Live Inbox</h2>
          <p className="text-xs text-slate-500">Monitor visitor sessions and handle human takeover for **{activeChatbot.name}**</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Sync Inbox
        </button>
      </div>

      {/* Split Inbox Screen */}
      <div className="flex-1 flex border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm min-h-0">
        
        {/* Left Side: Threads List */}
        <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversations Catalog</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-400">Loading threads...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs px-4">
                No active threads yet. Launch the chatbot standalone portal from overview page and send a message!
              </div>
            ) : (
              conversations.map((chat) => {
                const isSelected = chat.id === selectedId;
                const lastMsg = chat.messages[chat.messages.length - 1]?.content || "(Empty)";
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedId(chat.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition flex flex-col gap-1.5 ${
                      isSelected ? "bg-blue-50/40 border-l-4 border-blue-600 pl-3" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{chat.visitorId}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                        chat.status === "ACTIVE" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : chat.status === "PAUSED"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {chat.status === "PAUSED" ? "TAKEOVER" : chat.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate leading-normal">{lastMsg}</p>
                    <span className="text-[9px] text-slate-400 font-sans self-end mt-0.5">
                      {new Date(chat.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread Area */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/30">
          {activeThread ? (
            <>
              {/* Top Control Bar */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Visitor session: {activeThread.visitorId}
                  </h4>
                  <p className="text-[10px] text-slate-400">Created: {new Date(activeThread.messages[0]?.createdAt || activeThread.updatedAt).toLocaleString()}</p>
                </div>
                
                {/* Control Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeThread.status === "PAUSED" ? (
                    <button
                      onClick={() => handleStatusChange("ACTIVE")}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition"
                      title="AI auto-replies are disabled. Click to re-enable AI bot response."
                    >
                      <Play className="w-3 h-3" />
                      Resume AI Agent
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange("PAUSED")}
                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition"
                      title="AI auto-replies are active. Click to mute AI and reply directly."
                    >
                      <Pause className="w-3 h-3" />
                      Human Takeover
                    </button>
                  )}

                  {activeThread.status !== "CLOSED" && (
                    <button
                      onClick={() => handleStatusChange("CLOSED")}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] px-3 py-1.5 rounded-lg border border-slate-200 transition"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Close Thread
                    </button>
                  )}
                </div>
              </div>

              {/* Takeover Warn Ribbon */}
              {activeThread.status === "PAUSED" && (
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-[10px] text-amber-700 font-semibold shrink-0">
                  ⚠️ AI Auto-Replies are paused. The visitor is waiting for your direct response.
                </div>
              )}

              {/* Messages timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeThread.messages.map((msg) => {
                  const isAI = msg.sender === "AI" || msg.sender === "AGENT";
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
                    >
                      <span className="text-[9px] text-slate-400 mb-1 px-1">
                        {msg.sender === "AGENT" 
                          ? "💁‍♂️ Representative (You)" 
                          : msg.sender === "AI" 
                          ? `🤖 AI Agent (${activeChatbot.name})` 
                          : "Visitor"}
                      </span>
                      <div 
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-wrap ${
                          isAI
                            ? msg.sender === "AGENT"
                              ? "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm"
                              : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                            : "bg-blue-600 text-white rounded-tr-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    activeThread.status === "PAUSED"
                      ? "Type a response as representative..."
                      : "Type response (AI agent auto-reply is active - pause it to override)..."
                  }
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-xs transition flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-2.5 p-6">
              <Eye className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">Select a visitor thread from the sidebar list to inspect active logs.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
