import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, organizationName } = await req.json();

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          organizationId: org.id,
        },
      });

      // 3. Create a default chatbot agent for them
      await tx.chatbot.create({
        data: {
          name: "Default Assistant",
          organizationId: org.id,
          instructions: `You are SupportIQ's Customer Support AI Assistant. Your goal is to help visitors by answering questions based on the uploaded business knowledge. Be polite, professional, and concise. If the context does not contain the answer, say: "I am sorry, but I do not have information on that topic. Let me connect you to a human agent."`,
        },
      });

      return { user, org };
    });

    // Sign JWT token
    const token = signToken({ userId: result.user.id, email: result.user.email });

    // Build response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizationId: result.org.id,
        organizationName: result.org.name,
      },
    });

    response.headers.set(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure=${process.env.NODE_ENV === "production" ? "true" : "false"}`
    );

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
