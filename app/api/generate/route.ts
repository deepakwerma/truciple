import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { conversations, messages, llmResponses } from "@/lib/db/schema";
import { generateAll } from "@/lib/llm/generateAll";
import { checkDeviceLimit, recordDeviceUsage } from "@/lib/db/queries/limits";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = body?.prompt;
  const deviceToken = body?.deviceToken;
  const conversationId = body?.conversationId as string | undefined;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
  }
  if (!deviceToken || typeof deviceToken !== "string") {
    return NextResponse.json({ error: "deviceToken is required" }, { status: 400 });
  }

  const { userId } = await auth();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limitCheck = await checkDeviceLimit(deviceToken, ip, userId);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason }, { status: 429 });
  }

  let convoId = conversationId;
  if (!convoId) {
    const [newConvo] = await db
      .insert(conversations)
      .values({ deviceToken, userId: userId ?? null })
      .returning({ id: conversations.id });
    convoId = newConvo.id;
  }

  const [message] = await db
    .insert(messages)
    .values({ conversationId: convoId, prompt })
    .returning({ id: messages.id });

  const results = await generateAll(prompt);

  const savedResponses = await Promise.all(
    results.map((r) =>
      db
        .insert(llmResponses)
        .values({
          messageId: message.id,
          provider: r.provider,
          providerUsed: r.provider,
          responseText: r.status === "success" ? r.text : null,
          status: r.status,
          latencyMs: r.latencyMs,
        })
        .returning()
    )
  );

  await recordDeviceUsage(deviceToken, ip, userId);

  return NextResponse.json({
    conversationId: convoId,
    messageId: message.id,
    responses: savedResponses.flat(),
  });
}