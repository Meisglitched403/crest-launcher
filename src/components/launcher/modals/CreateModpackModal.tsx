import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Boxes, Check } from "lucide-react";
import type { LiveVersion } from "@/lib/minecraft-api";

export function CreateModpackModal({
  versions,
  versionsLoading,
  onClose,
  onCreateModpack,
}: {
  versions: LiveVersion[];
  versionsLoading: boolean;
  onClose: () => void;
  onCreateModpack: (
    name: string,
    mcVersion: string,
    loaderType: "vanilla" | "fabric",
  ) => void;
}) {
  const [name, setName] = useState("");
  const [mcVersion, setMcVersion] = useState("");
  const [loaderType, setLoaderType] = useState<"vanilla" | "fabric">("fabric");

  const vanillaVersions = versions.filter(
    (v) => v.loaderType === "vanilla" && v.type === "Release",
  );

  const handleCreate = () => {
    if (!name.trim() || !mcVersion) return;
    onCreateModpack(name.trim(), mcVersion, loaderType);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              New Modpack
            </div>
            <h3 className="font-display text-xl font-semibold">
              Create Modpack
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <label className="mb-4 block">
          <div className="mb-1.5 text-xs text-muted-foreground">
            Modpack Name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Modded World"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
            autoFocus
          />
        </label>

        {/* MC Version */}
        <label className="mb-4 block">
          <div className="mb-1.5 text-xs text-muted-foreground">
            Minecraft Version
          </div>
          {versionsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : (
            <select
              value={mcVersion}
              onChange={(e) => setMcVersion(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Select version…</option>
              {vanillaVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} {v.stable ? "(Latest)" : ""}
                </option>
              ))}
            </select>
          )}
        </label>

        {/* Loader */}
        <div className="mb-5">
          <div className="mb-1.5 text-xs text-muted-foreground">
            Mod Loader
          </div>
          <div className="flex gap-2">
            {(["fabric", "vanilla"] as const).map((lt) => (
              <button
                key={lt}
                onClick={() => setLoaderType(lt)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  loaderType === lt
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {lt === "fabric" ? "Fabric" : "Vanilla"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || !mcVersion}
          className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          Create Modpack
        </button>
        {!name.trim() && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Enter a modpack name first
          </p>
        )}
        {name.trim() && !mcVersion && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Select a Minecraft version first
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}