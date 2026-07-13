"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { 
  BarChart3, TrendingUp, HelpCircle, Star, Users, MessageSquare, 
  Clock, ArrowUpRight, Zap
} from "lucide-react";

interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  averageRating: number;
  avgResponseTimeSec: number;
  accuracyRate: number;
}

interface TrendDay {
  date: string;
  conversations: number;
  messages: number;
}

interface TopQuestion {
  question: string;
  count: number;
}

export default function AnalyticsPage() {
  const { activeChatbot } = useDashboard();
  
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeChatbot) return;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/analytics?chatbotId=${activeChatbot.id}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.summary);
          setTrend(data.trend);
          setQuestions(data.topQuestions);
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [activeChatbot]);

  if (!activeChatbot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-slate-200 rounded-2xl p-8">
        <BarChart3 className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold font-outfit text-slate-800">No AI agent active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Create a chatbot from the dropdown selector on the sidebar to check charts.</p>
      </div>
    );
  }

  // Find max value in trend to compute percentage heights for our bars
  const maxConv = trend.length > 0 ? Math.max(...trend.map(d => d.conversations), 5) : 10;

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Analytics</h2>
          <p className="text-xs text-slate-500">Performance insights for bot **{activeChatbot.name}**</p>
        </div>
        <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          Real-time aggregates
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Deflections</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold font-outfit text-slate-800">{isLoading ? "..." : metrics?.totalConversations ?? 0}</p>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
            <span>vs previous week</span>
          </div>
        </div>

        {/* Metric Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chat Resolution Rate</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold font-outfit text-slate-800">{isLoading ? "..." : `${metrics?.accuracyRate ?? 94}%`}</p>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              1.8%
            </span>
            <span>AI accuracy index</span>
          </div>
        </div>

        {/* Metric Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Satisfied Visitors</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold font-outfit text-slate-800">{isLoading ? "..." : `${metrics?.averageRating ?? 4.5} / 5`}</p>
          <div className="text-[10px] text-slate-400 font-medium">
            <span>Average conversation review rating</span>
          </div>
        </div>

        {/* Metric Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Deflect Speed</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold font-outfit text-slate-800">{isLoading ? "..." : `${metrics?.avgResponseTimeSec ?? 12}s`}</p>
          <div className="text-[10px] text-slate-400 font-medium">
            <span>Under 15s instant reply SLA</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Queries Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CSS Bar Chart (Left Panel) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-8 space-y-6">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Conversations Deflection Volume</h3>

          {isLoading ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400">Aggregating records...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Graphic Chart Bar pane */}
              <div className="h-[200px] flex items-end gap-5 sm:gap-8 px-4 border-b border-slate-200 pb-2 relative">
                {/* Horizontal Guide lines */}
                <div className="absolute left-0 right-0 top-0 border-t border-slate-100 border-dashed pointer-events-none"></div>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-slate-100 border-dashed pointer-events-none"></div>
                
                {trend.map((day, idx) => {
                  const percentage = (day.conversations / maxConv) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative z-10">
                      {/* Tooltip value */}
                      <span className="absolute -top-8 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-md">
                        {day.conversations} chats
                      </span>
                      {/* Bar */}
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md hover:from-blue-500 hover:to-indigo-400 transition cursor-pointer"
                        style={{ height: `${Math.max(percentage, 8)}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Dates Axis labels */}
              <div className="flex items-center justify-between px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {trend.map((day, idx) => (
                  <span key={idx} className="flex-1 text-center truncate">{day.date}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Most Asked Queries List (Right Panel) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-4 space-y-4">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            Top Asked Questions
          </h3>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400">Cataloging...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition duration-200"
                >
                  <p className="text-[11px] font-semibold text-slate-700 leading-relaxed break-words">{q.question}</p>
                  <span className="bg-blue-50 text-blue-600 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                    {q.count}x
                  </span>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-xs">No user messages logged yet.</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
