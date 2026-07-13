"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, Check, MessageSquare, Bot, Database, BarChart3, Settings, Shield, Sparkles, 
  HelpCircle, ChevronDown, MessageCircle, ArrowUpRight, Zap, Globe, FileText
} from "lucide-react";

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for testing and small personal projects.",
      price: 0,
      features: [
        "1 AI Support Bot",
        "Upload up to 5 documents (PDF/TXT)",
        "100 messages per month",
        "Deterministic cosine local similarity RAG",
        "Standard Chat widget embed",
        "SupportIQ branding"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Growth",
      description: "For growing businesses needing active automation.",
      price: isYearly ? 39 : 49,
      features: [
        "3 AI Support Bots",
        "Upload up to 50 documents (PDF/DOCX/TXT)",
        "2,000 messages per month",
        "Custom instructions & suggestions",
        "Human agent takeover inbox",
        "Remove SupportIQ branding",
        "Basic analytics logs"
      ],
      cta: "Upgrade to Growth",
      popular: true
    },
    {
      name: "Scale",
      description: "For agencies and large platforms managing multiple client sites.",
      price: isYearly ? 159 : 199,
      features: [
        "Unlimited AI Support Bots",
        "Upload unlimited documents (all formats)",
        "15,000 messages per month",
        "Advanced analytics charts",
        "Priority OpenRouter LLM speeds",
        "Custom branding widget configurations",
        "24/7 dedicated support representative"
      ],
      cta: "Get Scale Now",
      popular: false
    }
  ];

  const faqs = [
    {
      q: "How does SupportIQ AI train on my business documents?",
      a: "SupportIQ AI extracts the raw text from your uploaded documents (PDFs, DOCX, TXT, and Markdown files), cleanses formatting, and segments them into semantic chunks. We compute vector embeddings for each chunk to build a private knowledge base. When a user asks a question, we query the most relevant chunks using cosine vector similarity and feed them as context to the AI model."
    },
    {
      q: "Can I take over conversations when the AI doesn't know the answer?",
      a: "Yes! SupportIQ AI supports human takeover mode. From your conversation inbox in the dashboard, you can view the live chat feed, pause the AI bot dynamically, and type responses directly to your visitor. The AI stays silent until you choose to reactivate it."
    },
    {
      q: "How do I embed the chat widget on my website?",
      a: "Embedding is as simple as copy-pasting a single script line. Under your chatbot's management settings, you'll see a script tag (e.g. `<script src='.../supportiq-widget.js' data-chatbot-id='...'></script>`). Paste it inside your HTML body, and the floating chat bubble will appear instantly."
    },
    {
      q: "What AI models power the support response?",
      a: "By default, we support Google's Gemini-2.5-Flash via OpenRouter to deliver lightning-fast, high-quality contextual answers. You can also configure other models or hook in your own API key directly inside your dashboard settings."
    }
  ];

  return (
    <div className="dark-theme bg-slate-950 text-slate-100 min-h-screen grid-bg-dark font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-1.5 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </span>
            <span className="font-outfit font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SupportIQ <span className="text-blue-500 font-bold">AI</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition">Features</a>
            <a href="#how-it-works" className="hover:text-slate-100 transition">How it Works</a>
            <a href="#pricing" className="hover:text-slate-100 transition">Pricing</a>
            <a href="#faq" className="hover:text-slate-100 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs text-blue-400 font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Customer Support Automation
          </div>

          <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Train AI Support Agents on Your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Private Business Knowledge
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Upload PDFs, DOCX, text files, or markdown document logs. Embed a custom-branded AI chat widget on your website in minutes. Deflect 70% of support queries automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-500/20">
              Create Free Assistant
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold px-8 py-4 rounded-xl text-base transition">
              See How it Works
            </a>
          </div>

          {/* Interactive Preview Widget */}
          <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-2 relative shadow-2xl shadow-blue-500/5">
            <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden aspect-[16/9] flex flex-col">
              {/* Header Mock */}
              <div className="bg-slate-950 border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/40"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/40"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/40"></span>
                </div>
                <div className="text-xs text-slate-500 font-medium">dashboard/chatbots/preview</div>
                <div className="w-6"></div>
              </div>
              {/* Mock Split view */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left control Panel */}
                <div className="w-1/3 border-r border-white/5 p-4 text-left hidden sm:flex flex-col gap-4 bg-slate-950/50">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Bot Name</label>
                    <div className="text-xs bg-slate-900 border border-white/5 px-2.5 py-1.5 rounded-lg text-slate-300 font-medium">IQ Assistant</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Role Instructions</label>
                    <div className="text-[11px] text-slate-400 bg-slate-900 border border-white/5 p-2 rounded-lg leading-relaxed h-[120px] overflow-y-auto">
                      You are a helpful customer support agent for SupportIQ AI. Use the private document base to answer return policy, widget integration, and account recovery questions.
                    </div>
                  </div>
                </div>
                {/* Right Chat screen */}
                <div className="flex-1 flex flex-col bg-slate-900/40 p-4">
                  <div className="flex-1 flex flex-col justify-end gap-3 text-left overflow-y-auto max-h-[220px] mb-2 pr-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 max-w-[80%] leading-relaxed">
                        Hello! Welcome to SupportIQ AI. I am trained on your knowledge base documentation. How can I help you today?
                      </div>
                    </div>
                    <div className="flex items-end gap-2 justify-end">
                      <div className="bg-blue-600 rounded-xl px-3 py-2 text-xs text-white max-w-[80%] leading-relaxed">
                        How do I install the widget script on Webflow?
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 max-w-[80%] leading-relaxed">
                        To install, simply copy your widget script from your dashboard and paste it right before the closing <code className="bg-slate-950 text-blue-400 px-1 py-0.5 rounded text-[10px]">&lt;/body&gt;</code> tag in Webflow&apos;s custom code page.
                        <div className="mt-2 pt-1.5 border-t border-slate-700/50 text-[10px] text-slate-400">
                          Source: <strong className="text-slate-300">integration_guide.txt</strong> (p. 2)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex gap-2">
                    <input type="text" disabled placeholder="Type a message..." className="flex-1 bg-slate-950/70 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none" />
                    <button disabled className="bg-blue-600 rounded-lg w-8 h-8 flex items-center justify-center text-white"><ArrowUpRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-950 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold mb-4">
              Everything You Need to Automate Customer Support
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We provide the core tools to ingest data, handle AI chats, configure widgets, and review analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Knowledge Ingestion (RAG)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload raw PDF, DOCX, TXT, or MD files. Our pipeline cleans, splits, generates vector embeddings, and stores them for semantic match queries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Streaming Conversations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience high-performance, word-by-word streaming responses. Cite exact source document titles and page numbers to avoid hallucinations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <Globe className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Embeddable Web Widget</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Copy-paste a single script tag into Webflow, Shopify, or custom HTML. Launches a floating chat interface that respects your color theme.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Human Takeover Mode</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Monitor incoming threads. Pause the AI automatically when a customer requires human assistance, and reply directly from the dashboard inbox.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <BarChart3 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Detailed Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track message counts, chat ratings, average response rates, deflection trends, and catalog your most frequently asked questions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Advanced Customization</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Refine instructions, greeting sentences, primary theme codes, suggestion chips, and switch LLM models directly inside organization settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold mb-4">
              Deploy Your Bot in 3 Simple Steps
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              No machine learning degree required. Ingest document files and go live in minutes.
            </p>
          </div>

          <div className="relative flex flex-col md:flex-row justify-between gap-12">
            {/* Step Line */}
            <div className="absolute top-[35px] left-[50px] right-[50px] h-[1px] bg-slate-800 hidden md:block z-0"></div>
            
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
              <div className="w-16 h-16 rounded-full bg-blue-600 border-4 border-slate-950 font-outfit text-xl font-bold flex items-center justify-center mb-6">
                1
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Create & Customize</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Name your assistant, tweak its system instructions, customize suggestions, and specify its branding colors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
              <div className="w-16 h-16 rounded-full bg-indigo-600 border-4 border-slate-950 font-outfit text-xl font-bold flex items-center justify-center mb-6">
                2
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Upload Knowledge Docs</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Upload PDFs, DOCX, text manuals, or markdown files. Our parser splits and embeds the data instantly for search.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
              <div className="w-16 h-16 rounded-full bg-violet-600 border-4 border-slate-950 font-outfit text-xl font-bold flex items-center justify-center mb-6">
                3
              </div>
              <h3 className="font-outfit text-lg font-bold mb-2">Copy Embed Script</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Copy your one-line script snippet and insert it into your site templates. The floating chat bubble is ready immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-950 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Start for free and scale as your traffic grows. Cancel or upgrade anytime.
            </p>

            {/* Toggler */}
            <div className="inline-flex items-center gap-3 bg-slate-900 border border-white/5 p-1 rounded-full mt-6 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsYearly(false)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition ${!isYearly ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Monthly
              </button>
              <button 
                type="button" 
                onClick={() => setIsYearly(true)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition flex items-center gap-1 ${isYearly ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Yearly
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <div 
                key={idx}
                className={`glass-panel p-8 rounded-2xl flex flex-col justify-between relative transition duration-300 ${
                  plan.popular ? "border-blue-500/50 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-outfit text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 leading-normal mb-6">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl font-extrabold">$</span>
                    <span className="text-5xl font-extrabold tracking-tight font-outfit">{plan.price}</span>
                    <span className="text-slate-500 text-sm font-medium">/mo</span>
                  </div>

                  {/* Feature Checkmarks */}
                  <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="bg-blue-500/10 text-blue-400 rounded-full p-0.5 mt-0.5 shrink-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href="/register" 
                  className={`w-full text-center inline-block font-semibold py-3 px-4 rounded-xl text-sm transition ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/20"
                      : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="glass-panel rounded-xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-semibold text-sm sm:text-base hover:text-blue-400 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-sm text-slate-400 border-t border-white/5 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 relative border-t border-white/5 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Deflect 70% of Customer Tickets?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Create your account today, upload your first document, and experience customer support on autopilot. No credit card required.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-500/20">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 rounded p-1 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </span>
            <span className="font-outfit font-extrabold text-slate-300">
              SupportIQ <span className="text-blue-500 font-bold">AI</span>
            </span>
          </div>
          
          <div className="flex items-center gap-8 text-slate-500 text-xs">
            <span>&copy; {new Date().getFullYear()} SupportIQ AI. All rights reserved.</span>
            <a href="#" className="hover:text-slate-300 transition">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
