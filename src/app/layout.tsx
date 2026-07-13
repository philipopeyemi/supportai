import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportIQ AI - AI-Powered Customer Support SaaS",
  description:
    "Deploy autonomous AI agents trained on your business documents to automate customer support in real-time.",
  keywords: ["AI customer support", "customer service automation", "Chatbase alternative", "Intercom AI", "RAG chatbot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-slate-900 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
