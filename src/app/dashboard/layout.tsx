"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { 
  Bot, LayoutDashboard, Settings, BarChart3, Database, MessageSquare, CreditCard, 
  LogOut, Plus, ChevronDown, User, Sparkles
} from "lucide-react";

function Sidebar() {
  const pathname = usePathname();
  const { user, chatbots, activeChatbot, setActiveChatbotById, refreshChatbots, logout } = useDashboard();
  const [showBotDropdown, setShowBotDropdown] = useState(false);
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [newBotName, setNewBotName] = useState("");

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/overview" },
    { label: "Chatbot Settings", icon: Bot, href: "/dashboard/chatbots" },
    { label: "Knowledge Base", icon: Database, href: "/dashboard/documents" },
    { label: "Live Inbox", icon: MessageSquare, href: "/dashboard/conversations" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { label: "Organization Settings", icon: Settings, href: "/dashboard/settings" },
    { label: "Billing & Plans", icon: CreditCard, href: "/dashboard/billing" },
  ];

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    setIsCreatingBot(true);

    try {
      const response = await fetch("/api/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBotName.trim() }),
      });

      if (response.ok) {
        const newBot = await response.json();
        setNewBotName("");
        setIsCreatingBot(false);
        await refreshChatbots();
        setActiveChatbotById(newBot.id);
      }
    } catch (error) {
      console.error("Error creating bot:", error);
      setIsCreatingBot(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2">
          <span className="bg-blue-600 rounded p-1 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </span>
          <div>
            <h1 className="font-outfit font-extrabold text-sm tracking-tight text-white">SupportIQ AI</h1>
            <p className="text-[10px] text-slate-500 font-semibold">{user?.organizationName || "Your Org"}</p>
          </div>
        </div>

        {/* Chatbot Selector */}
        <div className="p-4 border-b border-slate-800 relative">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5 px-1">Selected Agent</label>
          {activeChatbot ? (
            <button
              onClick={() => setShowBotDropdown(!showBotDropdown)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-left px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeChatbot.themeColor }}></span>
                {activeChatbot.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic px-1">No chatbots created.</div>
          )}

          {/* Selector Dropdown */}
          {showBotDropdown && (
            <div className="absolute top-[68px] left-4 right-4 bg-slate-950 border border-slate-800 rounded-xl mt-1 shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-[220px] overflow-y-auto">
              {chatbots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    setActiveChatbotById(bot.id);
                    setShowBotDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                    activeChatbot?.id === bot.id ? "bg-blue-600 text-white" : "hover:bg-slate-900 text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bot.themeColor }}></span>
                    {bot.name}
                  </span>
                </button>
              ))}
              
              {/* Inline Bot Creation */}
              <form onSubmit={handleCreateBot} className="border-t border-slate-800 mt-1.5 pt-1.5 flex gap-1">
                <input
                  type="text"
                  required
                  placeholder="New Bot Name..."
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-600"
                  disabled={isCreatingBot}
                />
                <button
                  type="submit"
                  disabled={isCreatingBot || !newBotName.trim()}
                  className="bg-blue-600 text-white rounded p-1 hover:bg-blue-500 disabled:opacity-50 shrink-0 flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Badge Profile / Logout */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate leading-tight">{user?.name || "User Profile"}</p>
            <p className="text-[9px] text-slate-500 truncate mt-0.5">{user?.email || "email@company.com"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { activeChatbot } = useDashboard();

  return (
    <div className="flex min-h-screen bg-slate-50 w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Header Ribbon warning if no bot active */}
        {!activeChatbot && (
          <div className="bg-amber-500/15 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-800 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Create a new AI Agent from the dropdown selector in the sidebar to begin training your knowledge base.</span>
          </div>
        )}
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <InnerLayout>{children}</InnerLayout>
    </DashboardProvider>
  );
}
