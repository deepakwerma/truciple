"use client";
import { PanelLeft } from "lucide-react";
import { UserButton, Show } from "@clerk/nextjs";
import { IconBrandGithub } from "@tabler/icons-react";

const MODELS = [
  {
    id: "gemini",
    label: "Gemini",
    colorVar: "var(--gemini)",
    bgVar: "rgba(107, 140, 174, 0.12)",
  },
  {
    id: "groq",
    label: "Llama",
    colorVar: "var(--llama)",
    bgVar: "rgba(184, 135, 90, 0.12)",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    colorVar: "var(--deepseek)",
    bgVar: "rgba(169, 120, 138, 0.12)",
  },
];

interface ModelToggleBarProps {
  enabled: string[];
  onToggle: (id: string) => void;
  onSidebarToggle: () => void;
  onSignInClick: () => void;
}

export function ModelToggleBar({
  enabled,
  onToggle,
  onSidebarToggle,
  onSignInClick,
}: ModelToggleBarProps) {
  return (
    <div className="h-14 shrink-0 flex items-center justify-between bg-surface border-b border-border px-(--space-5) select-none">
      <div className="flex items-center gap-(--space-4) overflow-x-auto scrollbar-none py-1">
        <button
          onClick={onSidebarToggle}
          className="flex items-center justify-center w-8 h-8 rounded-input border border-border text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer transition-colors focus-ring"
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-(--space-2)">
          {MODELS.map((m) => {
            const isActive = enabled.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => onToggle(m.id)}
                style={{
                  color: isActive ? m.colorVar : "var(--text-muted)",
                  backgroundColor: isActive ? m.bgVar : "transparent",
                  border: isActive
                    ? `1px solid ${m.colorVar}33`
                    : "1px solid var(--border)",
                }}
                className="h-8.5 px-(--space-3) rounded-full font-mono text-[12px] font-medium tracking-[0.02em] uppercase transition-colors hover:border-border-hover cursor-pointer focus-ring"
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-(--space-3) shrink-0">
        <a
          href="https://github.com/deepakwerma/truciple"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8.5 h-8.5 rounded-full border border-border text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors focus-ring"
          title="View source on GitHub"
        >
          <IconBrandGithub size={16} stroke={2} />
        </a>

        <Show when="signed-out">
          <button
            onClick={onSignInClick}
            className="h-8.5 px-(--space-3) rounded-full text-[13px] font-medium tracking-[0.01em] text-text-muted hover:text-text-primary hover:bg-surface-hover border border-border cursor-pointer transition-colors focus-ring"
          >
            Sign In
          </button>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
                userButtonTrigger: "focus-ring rounded-full",
              },
            }}
          />
        </Show>
      </div>
    </div>
  );
}
