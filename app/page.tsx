"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ModelToggleBar } from "@/components/layout/ModelToggleBar";
import { ProviderGrid } from "@/components/arena/ProviderGrid";
import { PromptComposer } from "@/components/arena/PromptComposer";
import { JudgeButton } from "@/components/arena/JudgeButton";
import { FinalAnswerCard } from "@/components/arena/FinalAnswerCard";
import { AuthModal } from "@/components/modals/AuthModal";
import { getDeviceToken } from "@/lib/getDeviceToken";
import { EmptyState } from "@/components/arena/EmptyState";

type Turn = {
  messageId: string;
  prompt: string;
  responses: any[];
  judgeResult: any | null;
  judging: boolean;
};

export default function Home() {
  const [enabled, setEnabled] = useState(["gemini", "groq", "deepseek"]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<"settings" | "limit">(
    "settings",
  );
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function toggleSidebar() {
    setDesktopSidebarOpen((v) => !v);
    setMobileSidebarOpen((v) => !v);
  }

  function toggleModel(id: string) {
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function handleNewChat() {
    setTurns([]);
    setConversationId(null);
    setLoading(false);
  }

  async function handleSubmit(prompt: string) {
    setLoading(true);
    const deviceToken = getDeviceToken();

    // 1. Optimistically add the user's turn immediately
    const tempId = `temp-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      {
        messageId: tempId,
        prompt,
        responses: [],
        judgeResult: null,
        judging: false,
      },
    ]);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        deviceToken,
        providers: enabled,
        conversationId,
      }),
    });
    const data = await res.json();

    if (res.status === 429) {
      setAuthReason("limit");
      setAuthOpen(true);
      setLoading(false);
      // remove the optimistic turn since it failed
      setTurns((prev) => prev.filter((t) => t.messageId !== tempId));
      return;
    }

    setConversationId(data.conversationId);

    // 2. Replace the temp turn with the real one (real messageId + responses)
    setTurns((prev) =>
      prev.map((t) =>
        t.messageId === tempId
          ? {
              messageId: data.messageId,
              prompt,
              responses: data.responses,
              judgeResult: null,
              judging: false,
            }
          : t,
      ),
    );
    setLoading(false);
  }

  async function handleJudge(messageId: string) {
    setTurns((prev) =>
      prev.map((t) =>
        t.messageId === messageId ? { ...t, judging: true } : t,
      ),
    );

    const res = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    const data = await res.json();

    setTurns((prev) =>
      prev.map((t) =>
        t.messageId === messageId
          ? { ...t, judgeResult: data, judging: false }
          : t,
      ),
    );
  }

  async function handleSelectConversation(id: string) {
    const res = await fetch(`/api/history/${id}`);
    const data = await res.json();

    if (res.ok) {
      setConversationId(data.conversationId);
      setTurns(
        data.turns.map((t: any) => ({
          messageId: t.messageId,
          prompt: t.prompt,
          responses: t.responses,
          judgeResult: t.verdict
            ? {
                winnerProvider: t.verdict.winnerResponseId
                  ? t.responses.find(
                      (r: any) => r.id === t.verdict.winnerResponseId,
                    )?.provider
                  : null,
                finalAnswer: t.verdict.reasoning,
                verdict: { reasoning: t.verdict.reasoning },
              }
            : null,
          judging: false,
        })),
      );
      setLoading(false);
    }
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex bg-bg">
      <Sidebar
        onSettingsClick={() => {
          setAuthReason("settings");
          setAuthOpen(true);
        }}
        onNewChat={handleNewChat}
        desktopOpen={desktopSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onSelectConversation={handleSelectConversation}
      />

      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        <ModelToggleBar
          enabled={enabled}
          onToggle={toggleModel}
          onSidebarToggle={toggleSidebar}
          onSignInClick={() => {
            setAuthReason("settings");
            setAuthOpen(true);
          }}
        />

        {turns.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <EmptyState />
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-7xl mx-auto px-(--space-6) py-(--space-6) space-y-(--space-8) w-full">
            {turns.map((turn) => {
              const canEvaluate =
                turn.responses.filter(
                  (r) => enabled.includes(r.provider) && r.status === "success",
                ).length >= 2;

              return (
                <div key={turn.messageId} className="space-y-(--space-6)">
                  <div className="w-full flex justify-end select-none">
                    <div className="max-w-[75%] bg-[rgba(74,155,127,0.06)] border border-[rgba(74,155,127,0.12)] rounded-card py-(--space-4) px-(--space-5) flex flex-col">
                      <span className="font-mono text-[11px] font-medium tracking-[0.02em] uppercase text-accent-signal opacity-80 mb-1.5">
                        YOU
                      </span>
                      <p className="font-sans text-[14px] leading-[1.6] text-text-primary whitespace-pre-wrap select-text">
                        {turn.prompt}
                      </p>
                    </div>
                  </div>

                  <ProviderGrid
                    responses={turn.responses}
                    loading={false}
                    enabled={enabled}
                  />

                  {!turn.judgeResult && canEvaluate && (
                    <JudgeButton
                      onClick={() => handleJudge(turn.messageId)}
                      loading={turn.judging}
                    />
                  )}

                  {turn.judgeResult && (
                    <FinalAnswerCard
                      winnerProvider={turn.judgeResult.winnerProvider}
                      finalAnswer={turn.judgeResult.finalAnswer}
                      reasoning={turn.judgeResult.verdict.reasoning}
                    />
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="space-y-(--space-6)">
                <ProviderGrid responses={[]} loading={true} enabled={enabled} />
              </div>
            )}
          </div>
        </div>

        <div className="h-20 shrink-0 bg-bg/75 backdrop-blur-md border-t border-border px-(--space-5) flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <PromptComposer onSubmit={handleSubmit} disabled={loading} />
          </div>
        </div>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        reason={authReason}
      />
    </div>
  );
}
