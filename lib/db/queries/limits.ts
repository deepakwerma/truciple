import { db } from "@/lib/db/client";
import { deviceUsage, ipUsage, apiUsage } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

const GUEST_LIMIT = 4;
const USER_LIMIT = 10;
const WINDOW_DAYS = 7;

function withinWindow(lastUsedAt: Date | string | null): boolean {
  if (!lastUsedAt) return false;
  const daysSince = (Date.now() - new Date(lastUsedAt).getTime()) / 86400000;
  return daysSince <= WINDOW_DAYS;
}

// ===== GATE 2: per-person weekly limit, checked by BOTH token and IP =====
export async function checkDeviceLimit(
  deviceToken: string,
  ip: string,
  userId: string | null,
) {
  const limit = userId ? USER_LIMIT : GUEST_LIMIT;

  const [tokenRow] = await db
    .select()
    .from(deviceUsage)
    .where(eq(deviceUsage.deviceToken, deviceToken));
  const [ipRow] = await db
    .select()
    .from(ipUsage)
    .where(eq(ipUsage.ipAddress, ip));

  const tokenCount =
    tokenRow && withinWindow(tokenRow.lastUsedAt) ? tokenRow.messageCount : 0;
  const ipCount =
    ipRow && withinWindow(ipRow.lastUsedAt) ? ipRow.messageCount : 0;

  // block if EITHER identifier has hit the limit — IP is the real backstop
  if (tokenCount >= limit || ipCount >= limit) {
    return {
      allowed: false,
      limit,
      reason: "Weekly limit reached. Try again later or sign up for more.",
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - Math.max(tokenCount, ipCount),
  };
}

// call this AFTER a successful generation, updates both tables
export async function recordDeviceUsage(
  deviceToken: string,
  ip: string,
  userId: string | null,
) {
  // --- device_usage upsert ---
  const [tokenRow] = await db
    .select()
    .from(deviceUsage)
    .where(eq(deviceUsage.deviceToken, deviceToken));

  if (!tokenRow) {
    await db
      .insert(deviceUsage)
      .values({
        deviceToken,
        ipAddress: ip,
        userId,
        messageCount: 1,
        lastUsedAt: new Date(),
      });
  } else if (!withinWindow(tokenRow.lastUsedAt)) {
    await db
      .update(deviceUsage)
      .set({ messageCount: 1, lastUsedAt: new Date(), userId })
      .where(eq(deviceUsage.deviceToken, deviceToken));
  } else {
    await db
      .update(deviceUsage)
      .set({
        messageCount: sql`${deviceUsage.messageCount} + 1`,
        lastUsedAt: new Date(),
        userId,
      })
      .where(eq(deviceUsage.deviceToken, deviceToken));
  }

  // --- ip_usage upsert ---
  const [ipRow] = await db
    .select()
    .from(ipUsage)
    .where(eq(ipUsage.ipAddress, ip));

  if (!ipRow) {
    await db
      .insert(ipUsage)
      .values({ ipAddress: ip, messageCount: 1, lastUsedAt: new Date() });
  } else if (!withinWindow(ipRow.lastUsedAt)) {
    await db
      .update(ipUsage)
      .set({ messageCount: 1, lastUsedAt: new Date() })
      .where(eq(ipUsage.ipAddress, ip));
  } else {
    await db
      .update(ipUsage)
      .set({
        messageCount: sql`${ipUsage.messageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(ipUsage.ipAddress, ip));
  }
}

// ===== GATE 1: global daily cap per provider =====
const DAILY_CAPS: Record<string, number> = {
  gemini: 1000,
  groq: 1000,
  openai: 1000,
  deepseek: 200,
};

export async function checkProviderCap(provider: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select()
    .from(apiUsage)
    .where(and(eq(apiUsage.provider, provider), eq(apiUsage.date, today)));

  const limit = DAILY_CAPS[provider] ?? 0;
  if (row && row.callCount >= limit) return false;
  return true;
}

export async function recordProviderCall(provider: string) {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(apiUsage)
    .values({ provider, date: today, callCount: 1 })
    .onConflictDoUpdate({
      target: [apiUsage.provider, apiUsage.date],
      set: { callCount: sql`${apiUsage.callCount} + 1` },
    });
}
