import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { messages, llmResponses, judgeVerdicts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  if (allMessages.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const turns = await Promise.all(
    allMessages.map(async (m) => {
      const responses = await db.select().from(llmResponses).where(eq(llmResponses.messageId, m.id));
      const [verdict] = await db.select().from(judgeVerdicts).where(eq(judgeVerdicts.messageId, m.id));
      return {
        messageId: m.id,
        prompt: m.prompt,
        responses,
        verdict: verdict ?? null,
      };
    })
  );

  return NextResponse.json({ conversationId, turns });
}