# SupportIQ AI - Customer Support Automation SaaS

SupportIQ AI is an enterprise-grade customer support automation SaaS platform similar to Intercom AI and Chatbase. It enables businesses to design, brand, and deploy AI support representative widgets trained directly on their private documentation, deflection parameters, and customer guides.

## Table of Contents
1. [Product Overview](#product-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [RAG Processing Architecture](#rag-processing-architecture)
5. [Database Architecture](#database-architecture)
6. [Installation & Local Setup](#installation--local-setup)
7. [Environment Variables](#environment-variables)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting & Windows SWC Compile Notes](#troubleshooting)

---

## Product Overview
SupportIQ AI serves small-and-medium businesses, SaaS teams, and agencies by providing instant customer support answers. Users can sign up, create multiple custom AI agents, feed private business manuals, monitor visitors threads, take over conversations, and review analytical metrics in real-time.

---

## Key Features
- **Premium SaaS Landing Page**: Modern dark-theme glassmorphism marketing layout with pricing plans, testimonies, and interactive FAQ panels.
- **Dynamic AI Agent Configurator**: Adjust name, role instructions (system prompts), suggestions chips, custom greeting messages, and brand theme colors.
- **Advanced Knowledge Base (RAG)**: Ingest, parse, and chunk PDF, DOCX, TXT, and Markdown files. Computes 384-dimensional vector similarity for instant context injection.
- **Streaming Conversations**: Fluid, word-by-word streaming AI responses with citation sources to maintain high context accuracy.
- **Helpdesk Inbox & Takeover**: A unified workspace lists active customer conversations, allowing human support representatives to pause the AI bot and chat directly with visitors.
- **Custom-Branded Chat Widget**: Self-contained client JS code that injects a floating toggle button hosting a responsive iframe chat portal.
- **Operational Analytics**: Daily message counts, deflection trends, CSAT score summaries, and frequently asked question lists.

---

## Technology Stack
- **Frontend Framework**: Next.js App Router (React, TypeScript)
- **Styling**: Tailwind CSS (dynamic design tokens + custom CSS overrides)
- **Database Engine**: PostgreSQL + pgvector (SQLite Dev Fallback)
- **Object Relational Mapper (ORM)**: Prisma Client
- **Security & Session**: Custom cookie-based JWT authentication and bcrypt password hashing
- **RAG Ingestion**: `pdf-parse` (PDF extraction) and `mammoth` (DOCX extraction)
- **AI Completion Provider**: OpenRouter API (defaults to Gemini 2.5 Flash)

---

## RAG Processing Architecture

```
[Document Upload] ➔ [Text Extraction] ➔ [Recursive Chunking] ➔ [Vector Generation] ➔ [Database Storage]
                                                                                            │
[Visitor Question] ➔ [Vector Query] ➔ [Cosine Similarity Fetch] ➔ [Context Injection] ➔ [AI Stream]
```

1. **Extraction**: Documents are parsed (`pdf-parse`, `mammoth` or plain text).
2. **Chunking**: Text is split into overlapping 800-character segments (150-char overlap) to retain page and sentence contexts.
3. **Vectorizer**: We generate 384-dimension semantic vectors. 
   - *Production Mode*: Queries OpenRouter/Cohere API.
   - *Offline/Dev Fallback*: Runs a deterministic token-hash vectorizer that computes cosine similarities locally in JavaScript, ensuring zero-dependency local testing.
4. **Similarity Engine**: Calculates dot product normalized cosine distances, returning the top-3 matching chunks to structure context guidelines for the LLM.

---

## Database Architecture
The database schema (`prisma/schema.prisma`) implements the following core tables:

- `User`: Handles registration credentials and bcrypt hashes.
- `Organization`: Manages multi-member team workspaces.
- `Chatbot`: Houses AI agent instructions, styling colors, and greeting messages.
- `Document`: Logs reference file properties and training states (`TRAINED`, `FAILED`, `PROCESSING`).
- `DocumentChunk`: Stores chunked paragraphs and stringified vector arrays.
- `Conversation`: Coordinates threads, visitor tracking tokens, and human takeover flags.
- `Message`: Retains individual messages, sender types (`USER`, `AI`, `AGENT`), and citation links.
- `Analytics`: Daily deflection tallies and performance stats.

---

## Installation & Local Setup

### 1. Clone & Initialize Environment
Verify Node.js LTS and Git are installed on your machine.
```bash
git clone <repository-url> supportiq-ai
cd supportiq-ai
```

### 2. Configure Environment variables
Copy the example environment settings:
```bash
cp .env.example .env
```
*(By default, this is pre-configured to run SQLite locally inside `dev.db` out of the box).*

### 3. Install Dependencies
```bash
npm install
```

### 4. Sync Database Schema
Initialize your local database file and generate your Prisma client classes:
```bash
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

## Environment Variables
Edit the `.env` file to persistent custom configurations:

- `DATABASE_URL`: Set to `"file:./dev.db"` for SQLite, or your PostgreSQL string: `"postgresql://user:pass@host:5432/db?schema=public"`.
- `JWT_SECRET`: Random hash string to encrypt visitor/user login sessions.
- `OPENROUTER_API_KEY`: Input your OpenRouter API key. If empty, the backend triggers an interactive mock RAG stream that searches your uploaded documents and outputs matched sentences, allowing full offline verification!
- `AI_MODEL`: Set to preferred model (e.g. `"google/gemini-2.5-flash"`).

---

## Production Deployment

### 1. Database Configuration (PostgreSQL + pgvector)
When deploying to staging or production (e.g., Supabase or Neon):
1. Enable `pgvector` extension in your database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Update your `.env`:
   - Change `provider` in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"`.
   - Update `DATABASE_URL` to point to your live PostgreSQL instance.
3. Push the migrations:
   ```bash
   npx prisma db push
   ```

### 2. Vercel Host Setup
1. Push the project to GitHub.
2. Link the repository inside your Vercel Dashboard.
3. Add your environment variables: `DATABASE_URL`, `JWT_SECRET`, `OPENROUTER_API_KEY`, and `AI_MODEL`.
4. Deploy. Vercel compiles the build bundle automatically using the configurations.

---

## Troubleshooting & Windows SWC Compile Notes
If compiling Next.js inside sandboxed Windows environments (e.g., Trae, Docker, or CI pipelines), you might encounter the native compilation error: `next-swc.win32-x64-msvc.node is not a valid Win32 application`.

**How we solved this in SupportIQ AI**:
1. We deleted the corrupted binary file located inside `node_modules/@next/swc-win32-x64-msvc`.
2. We force-reinstalled the correct architecture package:
   ```bash
   npm install @next/swc-win32-x64-msvc --force
   ```
3. If compiling inside environments that completely block native binary bindings, we configure Babel compilation by adding a `.babelrc` file at the root:
   ```json
   {
     "presets": ["next/babel"]
   }
   ```
   and installing the `@babel/runtime` package:
   ```bash
   npm install --save-dev @babel/runtime
   ```
   *(We have cleared the Babel config now that a clean SWC binary is compiled, keeping compile times ultra-fast).*
