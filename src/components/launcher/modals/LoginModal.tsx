import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import type { SessionResult } from "@/lib/tauri-commands";
import { signup, login, checkAvailability } from "@/lib/tauri-commands";

export function LoginModal({
  onDone,
  onClose,
}: {
  onDone: (s: SessionResult) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayMode, setDisplayMode] = useState<"prefix" | "custom">("prefix");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avail, setAvail] = useState<{
    available: boolean;
    mojangMatch: unknown;
  } | null>(null);

  const displayName = displayMode === "prefix" ? `C_${username}` : username;

  const handleCheck = async () => {
    if (!username) return;
    setError("");
    setAvail(null);
    try {
      const r = await checkAvailability(displayName);
      setAvail(r);
      if (!r.available) {
        if (displayMode === "custom") setDisplayMode("prefix");
        else setError("Display name taken");
      }
    } catch {
      setError("Check failed");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (
      !email ||
      !password ||
      (tab === "signup" && !username)
    ) {
      setError("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const result =
        tab === "signup"
          ? await signup(email, username, displayName, password)
          : await login(email, password);
      onDone(result);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
      >
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${tab === "signin" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${tab === "signup" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-4 p-6">
          {tab === "signup" && (
            <>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setAvail(null);
                  }}
                  placeholder="Steve"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDisplayMode("prefix")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${displayMode === "prefix" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}
                  >
                    C_ prefix
                  </button>
                  <button
                    onClick={() => setDisplayMode("custom")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${displayMode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}
                  >
                    Custom name
                  </button>
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  In-game name:{" "}
                  <span className="font-mono text-foreground">
                    {displayName || "—"}
                  </span>
                  {displayMode === "prefix" && (
                    <span className="ml-1 text-[10px] text-muted-foreground/50">
                      (avoids Mojang collision)
                    </span>
                  )}
                </div>
              </div>
              {displayName && displayMode === "custom" && (
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-50"
                >
                  Check availability
                </button>
              )}
              {avail && (
                <div
                  className={`text-xs ${avail.available ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {avail.available
                    ? "Name available!"
                    : "Name taken — switched to prefix mode"}
                </div>
              )}
            </>
          )}

          {tab === "signin" && (
            <>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </div>
            </>
          )}

          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </div>
          )}

          {error && <div className="text-xs text-rose-400">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl gradient-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : tab === "signup" ? "Create Account" : "Sign In"}
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs text-muted-foreground transition hover:text-foreground"
          >
            Continue without account
          </button>
        </div>
      </motion.div>
    </div>
  );
}