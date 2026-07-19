import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2,
  PackageIcon,
  Boxes,
  Share,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ViewHeader,
  SectionRow,
  PrimaryButton,
  GhostButton,
  IconButton,
} from "@/components/launcher/parts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { installVersion } from "@/lib/tauri-commands";
import type { ModpacksHook } from "@/components/launcher/lib/types";
import type { LiveVersion, LoaderType } from "@/lib/minecraft-api";
import { useVersionData } from "@/components/launcher/lib/use-version-data";

const FALLBACK_VERSIONS: LiveVersion[] = [
  { id: "26.2", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1.2", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.11", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.5", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.4", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.20.6", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.20.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.19.4", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.16.5", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
];

export function VersionsView({ modpacks }: { modpacks: ModpacksHook }) {
  const { versions, loading, error } = useVersionData();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("All");
  const filters = ["All", "Release", "Snapshot", "Vanilla", "Fabric", "NeoForge"] as const;

  const shown = versions.filter((v) => {
    if (filter === "All") return true;
    if (filter === "Release" || filter === "Snapshot") return v.type === filter;
    const loaderMap: Record<string, LoaderType> = {
      Vanilla: "vanilla",
      Fabric: "fabric",
      NeoForge: "neoforge",
    };
    return v.loaderType === loaderMap[filter];
  });

  const installMutation = useMutation({
    mutationFn: (v: LiveVersion) => installVersion(v.id, v.loaderType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installed-versions"] });
    },
  });

  const loaderBadgeTone = (loader: LoaderType) => {
    if (loader === "vanilla") return "bg-sky-500/20 text-sky-300";
    if (loader === "fabric") return "bg-violet-500/20 text-violet-300";
    if (loader === "neoforge") return "bg-amber-500/20 text-amber-300";
    return "bg-slate-500/20 text-slate-300";
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Versions"
        subtitle="Install, manage and pin your Minecraft versions. All data fetched live from Mojang, Fabric & NeoForge."
      />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching versions from Mojang, Fabric & NeoForge…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to fetch versions. Check your connection and try again.
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition",
                  filter === f
                    ? "gradient-primary text-primary-foreground"
                    : "glass hover:bg-white/10",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <ScrollArea className="glass rounded-2xl max-h-[600px]">
            <div>
            {shown.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No versions match this filter.
              </div>
            )}
            {shown.slice(0, 50).map((v, i) => {
              const loaderType = v.loaderType === "vanilla" ? "vanilla" : "fabric";
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]",
                    i !== shown.length - 1 &&
                      "border-b border-white/5",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg gradient-primary">
                    <PackageIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{v.id}</span>
                      {v.stable && v.loaderType === "vanilla" && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          LATEST
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          loaderBadgeTone(v.loaderType),
                        )}
                      >
                        {v.loaderType === "neoforge"
                          ? "NeoForge"
                          : v.loaderType.charAt(0).toUpperCase() + v.loaderType.slice(1)}
                      </span>
                      {!v.stable && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                          SNAPSHOT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.type} ·{" "}
                      {v.releaseTime
                        ? new Date(v.releaseTime).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconButton
                      icon={Boxes}
                      onClick={() => {
                        let mcVersion = v.id;
                        const fabMatch = v.id.match(/^Fabric\s+([\d.]+)/);
                        if (fabMatch) mcVersion = fabMatch[1];
                        const mcMatch = v.id.match(/\(MC\s+([\d.]+)\)/);
                        if (mcMatch) mcVersion = mcMatch[1];
                        modpacks.addModpack(v.id, mcVersion, loaderType);
                      }}
                      title="Create modpack from this version"
                    />
                    <button
                      onClick={() => installMutation.mutate(v)}
                      disabled={installMutation.isPending}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {installMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {installMutation.isPending ? "Installing…" : "Install"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </ScrollArea>
          {shown.length > 50 && (
            <div className="text-center text-xs text-muted-foreground">
              Showing 50 of {shown.length} versions
            </div>
          )}
        </>
      )}
    </div>
  );
}
