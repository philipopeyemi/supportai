"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { 
  Database, Upload, Trash2, FileText, Sparkles, CheckCircle2, 
  XCircle, AlertCircle, RefreshCw
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  fileType: string;
  status: string;
  size: number;
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

export default function KnowledgeBasePage() {
  const { activeChatbot } = useDashboard();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadDocuments = async () => {
    if (!activeChatbot) return;
    setIsLoadingList(true);
    try {
      const response = await fetch(`/api/documents?chatbotId=${activeChatbot.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeChatbot]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !activeChatbot) return;
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatbotId", activeChatbot.id);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process and train the document");
      }

      setMessage({ type: "success", text: `Successfully parsed and trained: ${file.name}` });
      setFile(null);
      // Reset the file input element manually
      const fileInput = document.getElementById("kb-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      await loadDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: error.message || "An unexpected error occurred." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document from the knowledge base? This will wipe all its trained vector chunks.")) return;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== docId));
        setMessage({ type: "success", text: "Document removed successfully." });
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to delete document from database." });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!activeChatbot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white border border-slate-200 rounded-2xl p-8">
        <Database className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold font-outfit text-slate-800">No AI agent active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Create a chatbot from the dropdown selector on the sidebar to upload training data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Knowledge Base</h2>
          <p className="text-xs text-slate-500">Provide document references to train **{activeChatbot.name}**</p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={isLoadingList}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-4 space-y-5">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Train New Document</h3>
          
          {message && (
            <div className={`p-4 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed ${
              message.type === "success" 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500/50 bg-slate-50/50 transition relative">
              <input
                id="kb-file-input"
                type="file"
                required
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-xs font-semibold text-slate-700">
                  {file ? file.name : "Select a document file"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  PDF, DOCX, TXT, or MD up to 10MB
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !file}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting & Indexing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Train Model on File
                </>
              )}
            </button>
          </form>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">How Training Works</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              We ingest your manual, segment it into logical sentences (chunks), and generate high-dimensional vectors. When visitors chat, the AI retrieves these matching parts to answer, ensuring accuracy and citing exact sources.
            </p>
          </div>
        </div>

        {/* Right Side: Documents List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-8 space-y-4">
          <h3 className="font-outfit text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Trained Knowledge Base</h3>

          {isLoadingList && documents.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400">Loading catalog...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <FileText className="w-10 h-10 text-slate-300" />
              <span>No knowledge base documents uploaded for this AI agent yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-2">Document Title</th>
                    <th className="py-3 px-2">Size</th>
                    <th className="py-3 px-2">Chunks</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-2 font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[240px]" title={doc.title}>{doc.title}</span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-500">{formatBytes(doc.size)}</td>
                      <td className="py-3.5 px-2 text-slate-500 font-mono font-medium">
                        {doc._count?.chunks ?? 0}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          doc.status === "TRAINED" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : doc.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            doc.status === "TRAINED" 
                              ? "bg-emerald-500" 
                              : doc.status === "PROCESSING"
                              ? "bg-blue-500 animate-ping"
                              : "bg-rose-500"
                          }`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition hover:bg-rose-50"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
