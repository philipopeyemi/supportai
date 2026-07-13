export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = params.id;

  try {
    // Verify document belongs to chatbot owned by user's organization
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        chatbot: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
