"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
}

interface Chatbot {
  id: string;
  name: string;
  themeColor: string;
  greetingMessage: string;
  instructions: string;
  suggestions: string;
}

interface DashboardContextType {
  user: User | null;
  chatbots: Chatbot[];
  activeChatbot: Chatbot | null;
  isLoading: boolean;
  setActiveChatbotById: (id: string) => void;
  refreshChatbots: () => Promise<void>;
  logout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [activeChatbot, setActiveChatbot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessionAndChatbots = async () => {
    try {
      // 1. Fetch Session
      const sessionResp = await fetch("/api/auth/session");
      if (!sessionResp.ok) {
        router.push("/login");
        return;
      }
      const sessionData = await sessionResp.json();
      setUser(sessionData.user);

      // 2. Fetch Chatbots
      const chatbotResp = await fetch("/api/chatbots");
      if (chatbotResp.ok) {
        const bots = await chatbotResp.json();
        setChatbots(bots);
        
        // Resolve active chatbot
        const savedBotId = localStorage.getItem("supportiq_active_bot");
        const matched = bots.find((b: Chatbot) => b.id === savedBotId);
        
        if (matched) {
          setActiveChatbot(matched);
        } else if (bots.length > 0) {
          setActiveChatbot(bots[0]);
          localStorage.setItem("supportiq_active_bot", bots[0].id);
        }
      }
    } catch (e) {
      console.error("Dashboard session sync error:", e);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndChatbots();
  }, []);

  const setActiveChatbotById = (id: string) => {
    const matched = chatbots.find(b => b.id === id);
    if (matched) {
      setActiveChatbot(matched);
      localStorage.setItem("supportiq_active_bot", id);
    }
  };

  const refreshChatbots = async () => {
    try {
      const chatbotResp = await fetch("/api/chatbots");
      if (chatbotResp.ok) {
        const bots = await chatbotResp.json();
        setChatbots(bots);
        
        // Sync active chatbot updates
        if (activeChatbot) {
          const updated = bots.find((b: Chatbot) => b.id === activeChatbot.id);
          if (updated) {
            setActiveChatbot(updated);
          } else if (bots.length > 0) {
            setActiveChatbot(bots[0]);
          } else {
            setActiveChatbot(null);
          }
        } else if (bots.length > 0) {
          setActiveChatbot(bots[0]);
        }
      }
    } catch (e) {
      console.error("Error refreshing chatbots:", e);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setChatbots([]);
      setActiveChatbot(null);
      localStorage.removeItem("supportiq_active_bot");
      router.push("/login");
    } catch (e) {
      console.error("Error logging out:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        chatbots,
        activeChatbot,
        isLoading,
        setActiveChatbotById,
        refreshChatbots,
        logout,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Securing session parameters...</p>
        </div>
      ) : (
        children
      )}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
