"use client";

interface JudgeButtonProps {
  onClick: () => void;
  loading: boolean;
}

export function JudgeButton({ onClick, loading }: JudgeButtonProps) {
  return (
    <div className="flex justify-center my-(--space-6)">
      <button
        onClick={onClick}
        disabled={loading}
        className={`h-10 px-(--space-6) rounded-button text-[13px] font-medium tracking-[0.01em] transition-colors cursor-pointer focus-ring flex items-center justify-center gap-2 select-none
          ${loading
            ? "bg-[rgba(74,155,127,0.15)] text-accent-signal border border-[rgba(74,155,127,0.3)] cursor-not-allowed"
            : "bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover hover:border-border-hover active:bg-surface"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            Judging
            <span className="animate-skeleton font-bold">. . .</span>
          </span>
        ) : (
          "Evaluate"
        )}
      </button>
    </div>
  );
}