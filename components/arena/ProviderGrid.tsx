"use client";
import { ModelCard } from "./ModelCard";

type ResponseData = {
  provider: string;
  status: "success" | "failed" | "unavailable";
  responseText?: string | null;
  latencyMs?: number;
};

export function ProviderGrid({
  responses,
  loading,
  enabled,
}: {
  responses: ResponseData[];
  loading: boolean;
  enabled: string[];
}) {
  // Loading state ke waqt hi enabled use karo (skeleton dikhane ke liye)
  // Baaki sab waqt, jo responses already aaye hain wahi dikhao
  const providersToShow = loading ? enabled : responses.map((r) => r.provider);

  const gridCols =
    providersToShow.length === 3 ? "lg:grid-cols-3" : providersToShow.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-(--space-4)`}>
      {providersToShow.map((p) => {
        const r = responses.find((x) => x.provider === p);
        return (
          <ModelCard
            key={p}
            provider={p}
            status={loading ? "loading" : (r?.status ?? "loading")}
            text={r?.responseText ?? undefined}
            latencyMs={r?.latencyMs}
          />
        );
      })}
    </div>
  );
}