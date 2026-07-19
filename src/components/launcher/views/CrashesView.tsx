import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Folder,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { ViewHeader, SectionRow } from "../parts";

export type CrashSeverity = "fatal" | "error" | "warn";
export type CrashEntry = {
  id: string;
  title: string;
  when: string;
  version: string;
  loader: string;
  exit: number;
  severity: CrashSeverity;
  cause: string;
  gameLog: string;
  launcherLog: string;
};

const severityStyle: Record<
  CrashSeverity,
  { chip: string; dot: string; label: string; icon: any }
> = {
  fatal: { chip: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-400", label: "FATAL", icon: Zap },
  error: { chip: "bg-amber-500/15 text-amber-300 border-amber-500/30", dot: "bg-amber-400", label: "ERROR", icon: AlertTriangle },
  warn: { chip: "bg-sky-500/15 text-sky-300 border-sky-500/30", dot: "bg-sky-400", label: "WARN", icon: AlertTriangle },
};

export function CrashLogsView() {
  const [entries, setEntries] = useState<CrashEntry[]>([]);
  const [selected, setSelected] = useState<CrashEntry | null>(null);
  const [tab, setTab] = useState<"game" | "launcher">("game");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | CrashSeverity>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8765/api/logs`);
      const data: CrashEntry[] = await res.json();
      setEntries(data);
      setSelected((s) => (s ? data.find((e) => e.id === s.id) ?? data[0] : data[0]));
    } catch { setSelected(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = filter === "all" ? entries : entries.filter((c) => c.severity === filter);
  const active = list.includes(selected as CrashEntry) ? (selected as CrashEntry) : list[0] ?? null;
  const logText = active ? (tab === "game" ? active.gameLog : active.launcherLog) : "";

  const copy = async () => {
    if (!active) return;
    try { await navigator.clipboard.writeText(logText); setCopied(true); setTimeout(() => setCopied(false), 1400); }
    catch {}
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Crash Logs"
        subtitle="Every failed launch is captured — inspect stack traces, compare launcher and game logs."
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => fetch(`http://127.0.0.1:8765/api/logs/open-folder`)} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/10">
              <Folder className="h-3.5 w-3.5" /> Open folder
            </button>
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "fatal", "error", "warn"] as const).map((f) => {
          const label = f === "all" ? "All" : severityStyle[f].label;
          const S = f !== "all" ? severityStyle[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "gradient-primary text-primary-foreground" : "glass hover:bg-white/10"}`}>
              {S && <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${S.dot}`} />}
              {label}
            </button>
          );
        })}
      </div>

      {!active ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-lg font-semibold text-muted-foreground">No crash logs yet</div>
          <div className="mt-1 text-sm text-muted-foreground/60">Crash reports will appear here after a failed launch.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
          {/* List */}
          <div className="glass overflow-hidden rounded-2xl">
            {list.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nothing to see here.</div>}
            {list.map((c, i) => {
              const isActive = c.id === active.id;
              const s = severityStyle[c.severity];
              return (
                <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-left px-4 py-3 transition ${i !== list.length - 1 ? "border-b border-white/5" : ""} ${isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} style={{ boxShadow: "0 0 10px currentColor" }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{c.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {c.when} · {c.version} · {c.loader}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="glass overflow-hidden rounded-2xl">
            <div className="border-b border-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityStyle[active.severity].chip}`}>
                      {severityStyle[active.severity].label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">exit {active.exit}</span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-tight">{active.title}</h3>
                  <div className="mt-1 font-mono text-xs text-rose-300/90">{active.cause}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copy} className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs hover:bg-white/10">
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy log</>}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetaBox l="Version" v={active.version} />
                <MetaBox l="Loader" v={active.loader} />
                <MetaBox l="When" v={active.when} />
                <MetaBox l="Exit code" v={String(active.exit)} />
              </div>
            </div>

            <div className="flex items-center gap-1 border-b border-white/5 px-3 py-2">
              <LogTab active={tab === "game"} onClick={() => setTab("game")} icon={FileText} label="Game log" />
              <LogTab active={tab === "launcher"} onClick={() => setTab("launcher")} icon={Terminal} label="Launcher log" />
              <div className="ml-auto text-[10px] font-mono text-muted-foreground">{logText.split("\n").length} lines</div>
            </div>

            <pre className="max-h-[440px] overflow-auto bg-black/45 p-5 font-mono text-[11.5px] leading-relaxed">
              {logText.split("\n").map((line, i) => {
                const isErr = /ERROR|FATAL|Exception|Caused by/.test(line);
                const isWarn = /WARN/.test(line);
                const color = isErr ? "text-rose-300" : isWarn ? "text-amber-300" : line.startsWith(" at ") ? "text-slate-400" : "text-emerald-100/90";
                return (
                  <div key={i} className="flex gap-3">
                    <span className="w-8 shrink-0 select-none text-right text-slate-600">{i + 1}</span>
                    <span className={color}>{line || " "}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaBox({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{l}</div>
      <div className="mt-0.5 truncate font-mono text-xs">{v}</div>
    </div>
  );
}

function LogTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}