"use client";
import { useEffect, useState } from "react";
import { Settings, PanelLeftClose } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

interface SidebarProps {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSettingsClick: () => void;
  onSelectConversation: (id: string) => void;
}

type Conversation = { id: string; title: string | null; createdAt: string };

export function Sidebar({
  desktopOpen,
  mobileOpen,
  onToggle,
  onNewChat,
  onSettingsClick,
  onSelectConversation,
}: SidebarProps) {
  const { isSignedIn } = useUser();
  const [history, setHistory] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!isSignedIn) {
      setHistory([]);
      return;
    }
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data.conversations ?? []))
      .catch(() => setHistory([]));
  }, [isSignedIn]);

  const sidebarContent = (
    <div className="w-64 h-full flex flex-col justify-between shrink-0">
      <div className="flex-1 flex flex-col p-(--space-4) pb-0 overflow-hidden">
        <div className="flex items-center justify-between mb-(--space-6) select-none h-10 shrink-0">
          <span className="font-mono text-[18px] font-medium tracking-[-0.02em] text-text-primary">
            trucible
          </span>
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-8 h-8 rounded-input border border-border text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer transition-colors focus-ring"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <button
          onClick={onNewChat}
          className="w-full h-10 rounded-button bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary text-[13px] font-medium tracking-[0.01em] transition-colors focus-ring cursor-pointer mb-(--space-6) shrink-0"
        >
          + New chat
        </button>

        <div className="flex-1 overflow-y-auto -mx-(--space-2) px-(--space-2) space-y-(--space-1) mb-(--space-4)">
          {isSignedIn && history.length > 0 && (
            <>
              <p className="font-sans text-[12px] font-normal leading-[1.4] text-text-muted mb-(--space-2) px-(--space-2) select-none">
                Recent
              </p>
              {history.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className="font-sans text-[13px] font-medium tracking-[0.01em] text-text-primary hover:bg-surface-hover rounded-input px-(--space-3) py-(--space-2) transition-colors cursor-pointer select-none truncate"
                >
                  {c.title ?? "Untitled"}
                </div>
              ))}
            </>
          )}

          {isSignedIn && history.length === 0 && (
            <p className="font-sans text-[12px] text-text-muted px-(--space-2) select-none">
              No conversations yet
            </p>
          )}

          {!isSignedIn && (
            <p className="font-sans text-[12px] text-text-muted px-(--space-2) select-none">
              Sign in to save your history
            </p>
          )}
        </div>
      </div>

      <div className="h-20 shrink-0 border-t border-border px-(--space-4) flex items-center bg-bg select-none">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-(--space-2) h-10 w-full text-[13px] font-medium tracking-[0.01em] text-text-muted hover:text-text-primary focus-ring cursor-pointer transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{ width: desktopOpen ? 256 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:block h-full overflow-hidden bg-bg border-r border-border shrink-0"
        style={{ borderRightWidth: desktopOpen ? 1 : 0 }}
      >
        {sidebarContent}
      </motion.div>

      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: mobileOpen ? 0 : -256 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="md:hidden fixed top-0 left-0 h-full bg-bg border-r border-border z-50"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
