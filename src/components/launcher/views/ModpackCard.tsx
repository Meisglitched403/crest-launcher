import { useState } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Check, Boxes, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModpacksHook } from "../lib/types";
import type { Modpack } from "@/hooks/use-modpacks";
import { ViewHeader } from "../parts";
import { useVersionData } from "../lib/use-version-data";
import { CreateModpackModal } from "../modals/CreateModpackModal";

export function ModpackCard({
  modpack,
  modpacks,
}: {
  modpack: Modpack;
  modpacks: ModpacksHook;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(modpack.name);

  const startRename = () => {
    setName(modpack.name);
    setRenaming(true);
  };
  const cancelRename = () => {
    setName(modpack.name);
    setRenaming(false);
  };
  const commitRename = () => {
    if (name.trim() && name.trim() !== modpack.name) {
      modpacks.updateModpack(modpack.id, { name: name.trim() });
    }
    setRenaming(false);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass group relative flex flex-col overflow-hidden rounded-2xl p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
            <Boxes className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                className="w-full rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-display text-base font-semibold outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="truncate font-display text-base font-semibold leading-tight">
                {modpack.name}
              </div>
            )}
            {!renaming && (
              <div className="truncate text-[11px] text-muted-foreground">
                Created{" "}
                {new Date(modpack.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        {!renaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10"
            title="Rename"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            MC
          </div>
          <div className="font-mono">
            {modpack.mcVersion} · {modpack.loaderType === "fabric" ? "Fabric" : "Vanilla"}
          </div>
        </div>
        <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Mods
          </div>
          <div className="font-mono">{modpack.mods?.length ?? 0}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {renaming ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                commitRename();
              }}
              className="flex-1 rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground"
            >
              Done
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelRename();
              }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs text-muted-foreground hover:bg-white/10"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => modpacks.selectModpack(modpack.id)}
              className="flex-1 rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:scale-[1.02]"
            >
              Select
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                modpacks.removeModpack(modpack.id);
              }}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-muted-foreground hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function useModpackCreateModal(modpacks: ModpacksHook) {
  const [open, setOpen] = useState(false);
  const { versions, loading: versionsLoading } = useVersionData();

  const modal = open ? (
    <CreateModpackModal
      versions={versions}
      versionsLoading={versionsLoading}
      onClose={() => setOpen(false)}
      onCreateModpack={(name, mcVersion, loaderType) => {
        const result = modpacks.addModpack(name, mcVersion, loaderType);
        if (result) {
          import("@/lib/tauri-commands").then((m) =>
            m.createInstance(name, mcVersion, loaderType).catch(
              () => {},
            ),
          );
          setOpen(false);
        }
      }}
    />
  ) : null;

  return { openCreateModal: () => setOpen(true), createModal: modal };
}

export function ModpacksView({ modpacks }: { modpacks: ModpacksHook }) {
  const [query, setQuery] = useState("");
  const { openCreateModal, createModal } = useModpackCreateModal(modpacks);
  const filtered = modpacks.modpacks.filter((m: Modpack) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Modpacks"
        subtitle="Your modpacks — launch-ready configurations."
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            <span className="text-base leading-none">+</span> Create Modpack
          </button>
        }
      />
      <div className="flex items-center gap-3">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modpacks…"
            className="w-48 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} modpack{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 && modpacks.modpacks.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          No modpacks yet. Create one above or from the Home tab.
        </div>
      ) : (
        <>
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Your Modpacks</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m: Modpack) => (
              <ModpackCard key={m.id} modpack={m} modpacks={modpacks} />
            ))}
          </div>
        </>
      )}

      {createModal}
    </div>
  );
}
