"use client";
import {
  SignIn,
  SignUp,
  useUser,
  UserButton,
  SignOutButton,
} from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { clerkAppearance } from "@/lib/theme/clerk-appearance";

export function AuthModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason: "settings" | "limit";
}) {
  const { isSignedIn, user, isLoaded } = useUser();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");

  useEffect(() => {
    if (open && isLoaded && isSignedIn) {
      onClose();
    }
  }, [isSignedIn, isLoaded, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 bg-surface border border-border rounded-full p-1 text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>

            {isSignedIn ? (
              <div className="flex flex-col items-center gap-4 py-6 bg-surface border border-border rounded-card">
                <UserButton appearance={clerkAppearance} />
                <p className="text-sm text-text-muted">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <SignOutButton>
                  <button className="text-xs px-4 py-2 rounded-button bg-surface-hover hover:bg-surface-elevated text-text-primary transition-colors">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <>
                {reason === "limit" && (
                  <p className="text-sm text-text-muted mb-3 text-center">
                    You've used your free messages this week. Sign up for more.
                  </p>
                )}

                <div className="flex gap-2 mb-4 justify-center">
                  <button
                    onClick={() => setMode("sign-in")}
                    className={`text-sm px-3 py-1 rounded-button ${
                      mode === "sign-in"
                        ? "bg-accent-signal text-text-inverse"
                        : "text-text-muted"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setMode("sign-up")}
                    className={`text-sm px-3 py-1 rounded-button ${
                      mode === "sign-up"
                        ? "bg-accent-signal text-text-inverse"
                        : "text-text-muted"
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-center"
                  >
                    {mode === "sign-in" ? (
                      <SignIn
                        routing="hash"
                        appearance={clerkAppearance}
                        fallbackRedirectUrl="/"
                      />
                    ) : (
                      <SignUp
                        routing="hash"
                        appearance={clerkAppearance}
                        fallbackRedirectUrl="/"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
