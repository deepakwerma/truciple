"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { ModelToggleBar } from "@/components/layout/ModelToggleBar";
import { ProviderGrid } from "@/components/arena/ProviderGrid";
import { PromptComposer } from "@/components/arena/PromptComposer";
import { JudgeButton } from "@/components/arena/JudgeButton";
import { FinalAnswerCard } from "@/components/arena/FinalAnswerCard";
import { AuthModal } from "@/components/modals/AuthModal";
import { getDeviceToken } from "@/lib/getDeviceToken";
import { EmptyState } from "@/components/arena/EmptyState";

export default function Home() {
  const [enabled, setEnabled] = useState(["gemini", "groq", "deepseek"]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<"settings" | "limit">(
    "settings",
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  function toggleModel(id: string) {
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function handleNewChat() {
    setResponses([]);
    setMessageId(null);
    setJudgeResult(null);
    setLoading(false);
    setJudging(false);
    setCurrentPrompt(null);
  }

  async function handleSubmit(prompt: string) {
    setLoading(true);
    setJudgeResult(null);
    setResponses([]);
    setCurrentPrompt(prompt);

    const deviceToken = getDeviceToken();
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, deviceToken, providers: enabled }),
    });
    const data = await res.json();

    if (res.status === 429) {
      setAuthReason("limit");
      setAuthOpen(true);
      setLoading(false);
      return;
    }

    setResponses(data.responses);
    setMessageId(data.messageId);
    setLoading(false);
  }

  async function handleJudge() {
    if (!messageId) return;
    setJudging(true);
    const res = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    const data = await res.json();
    setJudgeResult(data);
    setJudging(false);
  }

  async function handleSelectConversation(conversationId: string) {
    const res = await fetch(`/api/history/${conversationId}`);
    const data = await res.json();

    if (res.ok) {
      setCurrentPrompt(data.prompt);
      setMessageId(data.messageId);
      setResponses(data.responses);
      setJudgeResult(
        data.verdict
          ? {
              winnerProvider: data.verdict.winnerResponseId
                ? data.responses.find(
                    (r: any) => r.id === data.verdict.winnerResponseId,
                  )?.provider
                : null,
              finalAnswer: data.verdict.reasoning,
              verdict: { reasoning: data.verdict.reasoning },
            }
          : null,
      );
      setLoading(false);
    }
  }

  const canEvaluate =
    responses.filter(
      (r) => enabled.includes(r.provider) && r.status === "success",
    ).length >= 2;

  return (
    <div className="h-dvh w-screen overflow-hidden flex bg-bg">
      <Sidebar
        onSettingsClick={() => {
          setAuthReason("settings");
          setAuthOpen(true);
        }}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectConversation={handleSelectConversation}
      />

      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        <ModelToggleBar
          enabled={enabled}
          onToggle={toggleModel}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        
        {!currentPrompt && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <EmptyState />
          </div>
        )}

        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-7xl mx-auto px-(--space-6) py-(--space-6) space-y-(--space-6) w-full">
            

            {currentPrompt && (
              <div className="w-full flex justify-end select-none">
                <div className="max-w-[75%] bg-[rgba(74,155,127,0.06)] border border-[rgba(74,155,127,0.12)] rounded-card py-(--space-4) px-(--space-5) flex flex-col">
                  <span className="font-mono text-[11px] font-medium tracking-[0.02em] uppercase text-accent-signal opacity-80 mb-1.5">
                    YOU
                  </span>
                  <p className="font-sans text-[14px] leading-[1.6] text-text-primary whitespace-pre-wrap select-text">
                    {currentPrompt}
                  </p>
                </div>
              </div>
            )}

            {(responses.length > 0 || loading) && (
              <ProviderGrid
                responses={responses}
                loading={loading}
                enabled={enabled}
              />
            )}

            {responses.length > 0 &&
              !loading &&
              !judgeResult &&
              canEvaluate && (
                <JudgeButton onClick={handleJudge} loading={judging} />
              )}

            {judgeResult && (
              <FinalAnswerCard
                winnerProvider={judgeResult.winnerProvider}
                finalAnswer={judgeResult.finalAnswer}
                reasoning={judgeResult.verdict.reasoning}
              />
            )}
          </div>
        </div>

        <div className="shrink-0 bg-bg/75 backdrop-blur-md border-t border-border px-(--space-5) py-(--space-3) flex items-center min-h-16">
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
