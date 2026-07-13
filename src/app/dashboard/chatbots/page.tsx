"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Bot, Save, Sparkles, MessageCircle, RotateCcw, AlertCircle, Check } from "lucide-react";

export default function ChatbotSettingsPage() {
  const { activeChatbot, refreshChatbots } = useDashboard();

  // Form State
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [themeColor, setThemeColor] = useState("#2563eb");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync state with context
  useEffect(() => {
    if (activeChatbot) {
      setName(activeChatbot.name);
      setInstructions(activeChatbot.instructions);
      setGreetingMessage(activeChatbot.greetingMessage);
      setThemeColor(activeChatbot.themeColor);
      
      try {
        setSuggestions(JSON.parse(activeChatbot.suggestions));
      } catch (e) {
        setSuggestions(["What is SupportIQ AI?", "How do I upload documents?"]);
      }
    }
  }, [activeChatbot]);

  if (!activeChatbot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-slate-200 rounded-2xl p-8">
        <Bot className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold font-outfit text-slate-800">No AI agent active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Create a chatbot from the dropdown selector on the sidebar to edit settings.</p>
      </div>
    );
  }

  const handleAddSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.trim() || suggestions.length >= 6) return;
    setSuggestions([...suggestions, newSuggestion.trim()]);
    setNewSuggestion("");
  };

  const handleRemoveSuggestion = (idx: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/chatbots/${activeChatbot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          instructions,
          greetingMessage,
          themeColor,
          suggestions: JSON.stringify(suggestions),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration settings");
      }

      setFeedback({ type: "success", message: "AI Agent settings successfully updated!" });
      await refreshChatbots();

      // Clear banner after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error.message || "An unexpected error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Chatbot Settings</h2>
        <p className="text-xs text-slate-500">Fine-tune personality instructions, brand colors, and prompt suggestions.</p>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Panel */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-7 space-y-6">
          
          {/* Feedback banner */}
          {feedback && (
            <div className={`p-4 rounded-xl text-xs flex gap-2.5 items-start ${
              feedback.type === "success" 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}>
              {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Agent Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              placeholder="e.g. Sales Advisor"
            />
          </div>

          {/* Core System Instructions */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              Role Instructions
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            </label>
            <textarea
              required
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              placeholder="Write the rules and personality of your bot. e.g. Be polite and list citations..."
            />
            <span className="text-[10px] text-slate-400 leading-normal block mt-1.5">
              Explain who the AI represents, what tone it uses, and how it handles unanswerable questions.
            </span>
          </div>

          {/* Custom Greeting */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Welcome Greeting Message</label>
            <input
              type="text"
              required
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              placeholder="Hello! How can I help you?"
            />
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Brand Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-12 h-12 p-0 border border-slate-200 rounded-lg cursor-pointer bg-transparent"
              />
              <input
                type="text"
                pattern="^#[0-9A-Fa-f]{6}$"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400">Controls launcher icon and chat heading bar colors.</span>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Suggested Prompt Chips</label>
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {suggestions.map((sug, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-xs px-2.5 py-1.5 rounded-full font-medium text-slate-700"
                >
                  {sug}
                  <button
                    type="button"
                    onClick={() => handleRemoveSuggestion(i)}
                    className="text-slate-400 hover:text-rose-500 font-bold shrink-0 text-xs"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {suggestions.length === 0 && (
                <span className="text-xs text-slate-400 italic">No suggestion pills registered.</span>
              )}
            </div>

            {suggestions.length < 6 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New suggestion prompt..."
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddSuggestion}
                  disabled={!newSuggestion.trim()}
                  className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Add Chip
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 leading-normal block mt-1.5">Max 6 suggestions. Displays above input box for quick clicks.</span>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 mt-8 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Configuration..." : "Save Settings"}
          </button>

        </form>

        {/* Right Preview Panel */}
        <div className="lg:col-span-5 flex flex-col gap-3 sticky top-6">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block px-1">Live Interface Preview</label>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col h-[500px] bg-slate-50">
            {/* Header Preview */}
            <div 
              className="px-4 py-3.5 text-white flex items-center gap-2.5 transition-colors shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight truncate max-w-[180px]">{name || "AI Assistant"}</h4>
                <p className="text-[9px] text-white/80 mt-0.5">AI Support Active</p>
              </div>
            </div>
            
            {/* Message Pane Mock */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] text-slate-400 px-1">{name || "AI Assistant"}</span>
                <div className="bg-white border border-slate-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-800 max-w-[85%] leading-relaxed shadow-sm">
                  {greetingMessage || "Hello! How can I help you today?"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] text-slate-400 px-1">You</span>
                <div 
                  className="text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 text-xs max-w-[85%] leading-relaxed transition-colors shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  How do I update my billing email address?
                </div>
              </div>
            </div>

            {/* Suggestions Preview */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 flex flex-col gap-1 bg-white shrink-0 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto">
                  {suggestions.map((sug, i) => (
                    <span 
                      key={i}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 whitespace-nowrap"
                    >
                      {sug}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Preview */}
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <input type="text" disabled placeholder="Ask a question..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-400 focus:outline-none" />
              <button 
                type="button" 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
