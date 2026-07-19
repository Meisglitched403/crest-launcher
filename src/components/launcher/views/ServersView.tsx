import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  Play,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewHeader, SectionRow, PrimaryButton, GhostButton, IconButton, EmptyState } from "@/components/launcher/parts";
import type { ModpacksHook, ViewProps } from "../lib/types";
import { fetchServers, addServer, removeServer, pingServer, installVersion, launchGame } from "@/lib/tauri-commands";
import { useOfflineProfiles } from "@/hooks/use-offline-profiles";

export function ServersView({ modpacks, profiles, launching, setLaunching, setGameRunning }: ViewProps) {
  const [serversList, setServersList] = useState<{ name: string; address: string }[]>([]);
  const [pings, setPings] = useState<Record<string, number | null>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const session = null as any;

  const refresh = useCallback(async () => {
    try {
      const s = await fetchServers();
      setServersList(s);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async () => {
    if (!newName.trim() || !newAddr.trim()) return;
    try {
      await addServer(newName.trim(), newAddr.trim());
      setNewName(""); setNewAddr(""); setShowAdd(false);
      refresh();
    } catch {}
  };
  const handleRemove = async (addr: string) => { try { await removeServer(addr); refresh(); } catch {} };
  const handlePing = async (addr: string) => {
    try { const r = await pingServer(addr); setPings(prev => ({ ...prev, [addr]: r.ping_ms })); }
    catch { setPings(prev => ({ ...prev, [addr]: null })); }
  };
  const handleJoin = async (addr: string) => {
    if (launching) return;
    const active = modpacks.activeModpack;
    if (!active || !profiles.activeProfile) return;
    setLaunching(true);
    try {
      await installVersion(active.mcVersion, active.loaderType);
      await launchGame(active.mcVersion, 4096, active.name, undefined, undefined, addr);
      setGameRunning(true);
    } catch { /* fail silently */ }
    setLaunching(false);
  };

  const pingStyle = (p: number | null) => p == null ? "text-muted-foreground" : p < 50 ? "text-emerald-400" : p < 100 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Servers"
        subtitle="Your saved servers — add, ping, and join directly."
        action={
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            <Plus className="h-3 w-3" /> Add Server
          </button>
        }
      />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass flex flex-wrap items-end gap-3 rounded-2xl p-4">
              <div className="flex-1 min-w-0">
                <div className="mb-1 text-xs text-muted-foreground">Server Name</div>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="My SMP" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 text-xs text-muted-foreground">Address</div>
                <input value={newAddr} onChange={(e) => setNewAddr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="mc.example.com:25565" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none font-mono" />
              </div>
              <button onClick={handleAdd} disabled={!newName.trim() || !newAddr.trim()} className="rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading servers…</div>
      ) : serversList.length === 0 ? (
        <EmptyState icon={Server} message="No servers yet. Add one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {serversList.map((s) => {
            const ping = pings[s.address];
            return (
              <motion.div layout key={s.address} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass group relative flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                    <Server className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePing(s.address)} className="rounded-lg bg-white/5 p-1.5 text-xs text-muted-foreground hover:bg-white/10" title="Ping"><RefreshCw className="h-3 w-3" /></button>
                    <span className={`font-mono text-xs ${pingStyle(ping)}`}>{ping != null ? `${ping} ms` : "—"}</span>
                  </div>
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">{s.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{s.address}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleJoin(s.address)} disabled={launching} className="flex-1 flex items-center justify-center gap-2 rounded-xl gradient-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                    {launching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />} {launching ? "Launching…" : "Join"}
                  </button>
                  <IconButton icon={Trash2} onClick={() => handleRemove(s.address)} destructive title="Remove" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
