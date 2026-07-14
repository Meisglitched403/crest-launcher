import { useCallback, useEffect, useState } from "react";

export type Modpack = {
  id: string;
  name: string;
  mcVersion: string;
  loaderType: "vanilla" | "fabric";
  mods: string[];
  createdAt: string;
};

const STORAGE_KEY = "crest.modpacks";
const ACTIVE_KEY = "crest.active_modpack";
// ponytail: matches both legacy 1.x and modern 26.x+ MC version formats
const validMc = /^\d+\.\d+(\.\d+)?$/;

function load(): Modpack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(modpacks: Modpack[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modpacks));
  } catch {}
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useModpacks() {
  const [modpacks, setModpacks] = useState<Modpack[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = load();
    const good = loaded.filter((i) => validMc.test(i.mcVersion));
    if (good.length !== loaded.length) {
      setModpacks(good);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(good));
    } else {
      setModpacks(loaded);
    }
    const last = localStorage.getItem(ACTIVE_KEY);
    if (last && good.some((i) => i.id === last)) {
      setActiveId(last);
    } else if (good.length > 0) {
      setActiveId(good[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    save(modpacks);
  }, [modpacks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId, hydrated]);

  const addModpack = useCallback(
    (name: string, mcVersion: string, loaderType: "vanilla" | "fabric") => {
      if (!mcVersion || !validMc.test(mcVersion)) return null;
      const mp: Modpack = {
        id: makeId(),
        name,
        mcVersion,
        loaderType,
        mods: [],
        createdAt: new Date().toISOString(),
      };
      setModpacks((prev) => [...prev, mp]);
      setActiveId(mp.id);
      return mp;
    },
    [],
  );

  const removeModpack = useCallback(
    (id: string) => {
      setModpacks((prev) => {
        const next = prev.filter((i) => i.id !== id);
        if (activeId === id) {
          setActiveId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [activeId],
  );

  const selectModpack = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const updateModpack = useCallback(
    (id: string, patch: Partial<Pick<Modpack, "name" | "mcVersion" | "loaderType">>) => {
      setModpacks((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      );
    },
    [],
  );

  const activeModpack = modpacks.find((i) => i.id === activeId) ?? null;

  return {
    modpacks,
    activeModpack,
    activeId,
    addModpack,
    removeModpack,
    selectModpack,
    updateModpack,
    hydrated,
  };
}
