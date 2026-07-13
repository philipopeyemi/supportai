"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { 
  Users, MessageSquare, Star, Clock, Copy, Check, ArrowRight, Bot, 
  Sparkles, FileText, ChevronRight
} from "lucide-react";

interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  averageRating: number;
  avgResponseTimeSec: number;
  accuracyRate: number;
}

interface RecentThread {
  id: string;
  visitorId: string;
  status: string;
  updatedAt: string;
  messages: { sender: string; content: string }[];
}

export default function OverviewPage() {
  const { activeChatbot } = useDashboard();
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [recentChats, setRecentChats] = useState<RecentThread[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChatbot) return;

    const loadOverviewData = async () => {
      setIsLoading(true);
      try {
        // 1. Load Metrics
        const analResp = await fetch(`/api/analytics?chatbotId=${activeChatbot.id}`);
        if (analResp.ok) {
          const analData = await analResp.json();
          setMetrics(analData.summary);
        }

        // 2. Load Recent Conversations
        const convResp = await fetch(`/api/conversations?chatbotId=${activeChatbot.id}`);
        if (convResp.ok) {
          const convList = await convResp.json();
          setRecentChats(convList.slice(0, 4)); // Get top 4 threads
        }
      } catch (error) {
        console.error("Error loading overview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverviewData();
  }, [activeChatbot]);

  const embedScript = activeChatbot
    ? `<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/supportiq-widget.js" data-chatbot-id="${activeChatbot.id}"></script>`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(embedScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!activeChatbot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-slate-200 rounded-2xl p-8">
        <Bot className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold font-outfit text-slate-800">No AI agent active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Create a chatbot from the dropdown selector on the sidebar to inspect metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-outfit text-slate-800">Overview</h2>
          <p className="text-xs text-slate-500">Live operational metrics for bot **{activeChatbot.name}**</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Ingestion Ready
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Conversations</span>
            <span className="text-2xl font-extrabold text-slate-800 font-outfit">
              {isLoading ? "..." : metrics?.totalConversations ?? 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Message Volume</span>
            <span className="text-2xl font-extrabold text-slate-800 font-outfit">
              {isLoading ? "..." : metrics?.totalMessages ?? 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Customer Rating (CSAT)</span>
            <span className="text-2xl font-extrabold text-slate-800 font-outfit flex items-center gap-1">
              {isLoading ? "..." : `${metrics?.averageRating ?? 4.5} `}
              <span className="text-xs text-slate-400 font-semibold font-sans">/ 5</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Average Response Speed</span>
            <span className="text-2xl font-extrabold text-slate-800 font-outfit">
              {isLoading ? "..." : `${metrics?.avgResponseTimeSec ?? 12}s`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Embed Guide Codebox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 grid-bg-dark opacity-40 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="space-y-1.5 max-w-lg">
            <h3 className="font-outfit text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Embed Chatbot Widget
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste this snippet right before the closing <code className="bg-slate-950 text-blue-400 px-1 py-0.5 rounded text-[10px] font-mono">&lt;/body&gt;</code> tag on Webflow, WordPress, Shopify, or custom index code pages to launch the live floating bubble bubble immediately.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 max-w-[450px] overflow-x-auto select-all scrollbar-none font-mono text-[10px] text-slate-300 leading-normal whitespace-nowrap">
              {embedScript}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 self-end bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied Script
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Widget Script
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Split details table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Conversations */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-outfit text-sm font-bold text-slate-800">Recent Chats</h3>
            <Link href="/dashboard/conversations" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              View Inbox
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400">Loading threads...</span>
            </div>
          ) : recentChats.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No conversations logged yet. Open the chatbot public link and send a test message!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1]?.content || "(Empty)";
                return (
                  <Link 
                    key={chat.id}
                    href="/dashboard/conversations" 
                    className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-xl transition duration-200"
                  >
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{chat.visitorId}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          chat.status === "ACTIVE" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {chat.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[320px]">{lastMsg}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium font-sans">
                      {new Date(chat.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Launch Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Test Chatbot</h3>
            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mb-1 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Open Public Agent URL</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Launch your assistant in a full-screen standalone page. Test its instructions, verify uploaded content citations, and review how it replies in real-time.
              </p>
            </div>
          </div>
          
          <Link 
            href={`/chatbot/${activeChatbot.id}`}
            target="_blank"
            className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl text-xs transition mt-6 shadow-sm"
          >
            Launch Chatbot Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
