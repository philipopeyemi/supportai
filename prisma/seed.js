const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing records to avoid conflicts on repeat runs
  await prisma.user.deleteMany().catch(() => {});
  await prisma.organization.deleteMany().catch(() => {});
  await prisma.chatbot.deleteMany().catch(() => {});
  await prisma.document.deleteMany().catch(() => {});
  await prisma.documentChunk.deleteMany().catch(() => {});
  await prisma.conversation.deleteMany().catch(() => {});
  await prisma.analytics.deleteMany().catch(() => {});

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Acme Corporation",
    },
  });
  console.log(`🏢 Created Organization: ${org.name}`);

  // 3. Create Admin User
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Demo Admin",
      email: "demo@supportiq.ai",
      password: passwordHash,
      organizationId: org.id,
    },
  });
  console.log(`👤 Created User: ${user.name} (${user.email})`);

  // 4. Create AI Chatbot Agent
  const chatbot = await prisma.chatbot.create({
    data: {
      name: "Acme Advisor",
      organizationId: org.id,
      instructions: "You are the official Customer Advisor for Acme Corporation. Support users with refunds, shipping, and account inquiries using the context documents. Keep answers friendly, professional, and clear.",
      greetingMessage: "Welcome to Acme Corp! I am your AI Support Advisor. Ask me anything about our shipping, refunds, or product catalog.",
      themeColor: "#2563eb",
      suggestions: JSON.stringify([
        "What is the refund window?",
        "Do you offer free shipping?",
        "How do I reach support representatives?",
      ]),
    },
  });
  console.log(`🤖 Created AI Chatbot: ${chatbot.name}`);

  // 5. Ingest Demo Training Document
  const doc = await prisma.document.create({
    data: {
      title: "acme_policies.txt",
      chatbotId: chatbot.id,
      fileType: "txt",
      status: "TRAINED",
      size: 1530,
    },
  });
  console.log(`📄 Created Knowledge Document: ${doc.title}`);

  // 6. Seed document chunks and deterministic vectors
  const chunksData = [
    {
      content: "Acme Corporation offers a 30-day refund window for all products. To be eligible for a refund, products must be returned in their original packaging, unopened, and accompanied by the original receipt or proof of purchase. Refunds are processed back to the original payment method within 5-7 business days.",
      page: 1,
      queryKeyword: "refund"
    },
    {
      content: "We provide free standard shipping on all orders over $50 within the continental United States. Standard shipping takes 3-5 business days. Orders under $50 are subject to a flat shipping rate of $4.99. Expedited shipping is available at checkout for an additional $14.99.",
      page: 1,
      queryKeyword: "shipping"
    },
    {
      content: "If you need human assistance, our customer support representatives are available Monday through Friday, from 9:00 AM to 5:00 PM EST. You can contact support by emailing support@acme.com or by requesting a human takeover directly inside this chat window.",
      page: 2,
      queryKeyword: "support"
    }
  ];

  // Helper to generate the pseudo-embedding vector in Node (mimicking RAG.ts)
  const VECTOR_DIMENSION = 384;
  const hashString = (str) => {
    let hash = 17;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  };

  const computeVector = (text) => {
    const vector = new Array(VECTOR_DIMENSION).fill(0);
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) {
      vector[0] = 1.0;
      return vector;
    }
    for (const word of words) {
      const idx1 = hashString(word) % VECTOR_DIMENSION;
      const idx2 = hashString(word + "_2") % VECTOR_DIMENSION;
      vector[idx1] += 1.0;
      vector[idx2] += 0.5;
    }
    let sumSq = 0;
    for (let i = 0; i < VECTOR_DIMENSION; i++) sumSq += vector[i] * vector[i];
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < VECTOR_DIMENSION; i++) vector[i] /= norm;
    } else {
      vector[0] = 1.0;
    }
    return vector;
  };

  for (const chunk of chunksData) {
    const vector = computeVector(chunk.content);
    await prisma.documentChunk.create({
      data: {
        documentId: doc.id,
        content: chunk.content,
        pageNumber: chunk.page,
        embedding: JSON.stringify(vector),
      },
    });
  }
  console.log("⚡ Created 3 Vector-Indexed Knowledge Chunks.");

  // 7. Seed Demo Conversations History
  const conv = await prisma.conversation.create({
    data: {
      chatbotId: chatbot.id,
      visitorId: "visitor_acme_demo",
      status: "ACTIVE",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      sender: "USER",
      content: "What is your refund policy?",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      sender: "AI",
      content: "According to **acme_policies.txt** (Page 1), Acme Corporation offers a 30-day refund window. Products must be returned unopened, in original packaging, and with proof of purchase. Refunds take 5-7 business days to process.",
      sources: JSON.stringify([{ documentTitle: "acme_policies.txt", pageNumber: 1 }]),
    },
  });
  console.log("💬 Seeded test conversation thread history.");

  // 8. Daily Analytics trend mock data
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    
    await prisma.analytics.create({
      data: {
        id: `${chatbot.id}_${d.getTime()}`,
        chatbotId: chatbot.id,
        date: d,
        conversationsCount: Math.floor(Math.random() * 8) + 3,
        messagesCount: Math.floor(Math.random() * 18) + 8,
        avgResponseTimeMs: 12000,
        satisfiedCount: Math.floor(Math.random() * 5) + 2,
        unsatisfiedCount: Math.floor(Math.random() * 2),
      },
    });
  }
  console.log("📈 Seeded 7 days of metrics graph values.");

  console.log("🌿 Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
