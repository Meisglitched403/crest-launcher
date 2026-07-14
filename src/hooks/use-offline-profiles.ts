import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type OfflineProfile = {
  id: string;
  username: string;
  lastUsed: string;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "crest.offline_profiles";

function loadProfiles(): OfflineProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: OfflineProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // ponytail: localStorage full or disabled — silently ignore
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useOfflineProfiles() {
  const [profiles, setProfiles] = useState<OfflineProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadProfiles();
    setProfiles(loaded);
    const lastActive = localStorage.getItem("crest.active_profile");
    if (lastActive && loaded.some((p) => p.id === lastActive)) {
      setActiveId(lastActive);
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveProfiles(profiles);
  }, [profiles, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeId) localStorage.setItem("crest.active_profile", activeId);
    else localStorage.removeItem("crest.active_profile");
  }, [activeId, hydrated]);

  const addProfile = useCallback((username: string) => {
    const now = new Date().toISOString();
    const profile: OfflineProfile = {
      id: makeId(),
      username,
      lastUsed: now,
      createdAt: now,
    };
    setProfiles((prev) => [...prev, profile]);
    setActiveId(profile.id);
    return profile;
  }, []);

  const removeProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) {
        setActiveId((prev) => {
          const remaining = profiles.filter((p) => p.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    },
    [activeId, profiles],
  );

  const selectProfile = useCallback((id: string) => {
    setActiveId(id);
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, lastUsed: new Date().toISOString() } : p,
      ),
    );
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;

  return {
    profiles,
    activeProfile,
    activeId,
    addProfile,
    removeProfile,
    selectProfile,
    hydrated,
  };
}
