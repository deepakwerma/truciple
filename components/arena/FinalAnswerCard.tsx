"use client";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface FinalAnswerCardProps {
  winnerProvider: string;
  finalAnswer: string;
  reasoning: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  groq: "Llama",
  openai: "GPT-OSS",
  deepseek: "DeepSeek",
};

export function FinalAnswerCard({
  winnerProvider,
  finalAnswer,
  reasoning,
}: FinalAnswerCardProps) {
  const winnerLabel = PROVIDER_LABELS[winnerProvider] ?? winnerProvider;

  return (
    <div
      style={{
        backgroundColor: "rgba(176, 141, 87, 0.03)",
      }}
      className="flex flex-col rounded-card border border-border p-(--space-5) select-none mt-(--space-4) min-h-50"
    >
      <div className="flex items-center justify-between mb-(--space-4)">
        <span className="font-mono text-[12px] font-medium tracking-[0.02em] uppercase text-accent-judge">
          GPT-OSS Evaluation
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.02em] uppercase bg-[rgba(176,141,87,0.12)] text-accent-judge px-(--space-2) py-(--space-1) rounded-badge border border-[rgba(176,141,87,0.2)]">
          WINNER: {winnerLabel}
        </span>
      </div>

      <div className="flex-1 mb-(--space-4) font-sans text-[14px] leading-[1.6] text-text-primary">
        <MarkdownRenderer content={finalAnswer} />
      </div>

      <div className="mt-(--space-2)">
        <p className="font-sans text-[12px] font-normal leading-[1.4] text-text-muted">
          {reasoning}
        </p>
      </div>
    </div>
  );
}
