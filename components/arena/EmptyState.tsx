"use client";

export function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 text-center sm:px-8 md:px-10 md:py-10">
      <h1 className="text-3xl font-bold text-text-primary">
        Ask once. See how three models think.
      </h1>

      <p className="mt-3 mx-auto max-w-xl text-[15px] leading-relaxed text-text-muted">
        Gemini, Llama, and DeepSeek answer in parallel then an independent judge
        picks the best one and tells you why.
      </p>

      <p className="mt-4 text-[13px] font-mono uppercase tracking-wide text-text-muted/70">
        Free to try -- no signup needed to start
      </p>
    </div>
  );
}
