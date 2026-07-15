"use client";
import {
  SignIn,
  SignUp,
  useUser,
  UserButton,
  SignOutButton,
} from "@clerk/nextjs";
import { useState } from "react";
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
  const { isSignedIn, user } = useUser();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-surface border border-border rounded-card p-6 max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
        >
          <X size={18} />
        </button>

        {isSignedIn ? (
          <div className="flex flex-col items-center gap-4 py-6">
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
              <p className="text-sm text-text-muted mb-4 text-center">
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

            {mode === "sign-in" ? (
              <SignIn routing="hash" appearance={clerkAppearance} />
            ) : (
              <SignUp routing="hash" appearance={clerkAppearance} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
