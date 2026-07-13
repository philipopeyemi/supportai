"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Settings, Shield, KeyRound, Building, Save, Sparkles, Check, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshChatbots } = useDashboard();

  // Form State
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setOrgName(user.organizationName);
      // Read saved mock keys from localStorage to simulate DB persistence for client settings
      setApiKey(localStorage.getItem("supportiq_openrouter_key") || "");
      setModel(localStorage.getItem("supportiq_ai_model") || "google/gemini-2.5-flash");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      // 1. Save Org Name (in real app, issues PATCH /api/organizations)
      // We simulate successful API sync and save credentials in local storage
      localStorage.setItem("supportiq_openrouter_key", apiKey);
      localStorage.setItem("supportiq_ai_model", model);

      // Trigger a session change in context
      if (user) {
        user.organizationName = orgName;
      }

      setFeedback({ type: "success", text: "Settings saved successfully!" });
      
      // Delay clear
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", text: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Settings</h2>
        <p className="text-xs text-slate-500">Configure your organization workspace profile and AI provider credentials.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {feedback && (
          <div className={`p-4 rounded-xl text-xs flex gap-2.5 items-start ${
            feedback.type === "success" 
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}>
            {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Section 1: Organization Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-blue-600" />
            Organization Profile
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Company / Organization Name</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              placeholder="e.g. Acme Corporation"
            />
          </div>
        </div>

        {/* Section 2: AI Provider Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-outfit text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              AI Model Provider
            </h3>
            <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              OpenRouter.ai API Integration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">OpenRouter API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                placeholder="sk-or-v1-..."
              />
              <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                Input your OpenRouter key to enable production-grade LLM stream responses. If empty, the system automatically runs using simulated context replies.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Preferred AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              >
                <option value="google/gemini-2.5-flash">Google: Gemini 2.5 Flash (Recommended)</option>
                <option value="meta-llama/llama-3-8b-instruct">Meta: Llama 3 8B Instruct</option>
                <option value="meta-llama/llama-3-70b-instruct">Meta: Llama 3 70B Instruct</option>
                <option value="openai/gpt-4o-mini">OpenAI: GPT-4o Mini</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                Select your preferred language model for processing chat queries on your website.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Security */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            Security & Compliance
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            All trained text chunks are encrypted and stored in your private database index. Client widget queries are rate-limited to prevent scraping, and raw document files are discarded immediately after chunk text extraction is complete.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving changes..." : "Save Configuration"}
        </button>

      </form>
    </div>
  );
}
