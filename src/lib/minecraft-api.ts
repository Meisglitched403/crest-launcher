export type LoaderType = "vanilla" | "fabric" | "neoforge";

export type LiveVersion = {
  id: string;
  type: string;
  loaderType: LoaderType;
  releaseTime: string;
  stable: boolean;
};

/* ------------------------------------------------------------------ */
/*  HTTP fetch — Tauri native when available, browser fallback         */
/* ------------------------------------------------------------------ */

async function httpFetch(url: string): Promise<any> {
  try {
    // Dynamic import so the module doesn't blow up in a plain browser
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
    const res = await tauriFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    // ponytail: fallback to browser fetch when Tauri plugin unavailable
    const res = await window.fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

/* ------------------------------------------------------------------ */
/*  In-memory cache (5 min TTL)                                        */
/* ------------------------------------------------------------------ */

type CacheEntry = { data: unknown; ts: number };
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e || Date.now() - e.ts > TTL) return null;
  return e.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  Vanilla (Mojang)                                                   */
/* ------------------------------------------------------------------ */

const MOJANG_MANIFEST =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

export async function fetchVanillaVersions(): Promise<LiveVersion[]> {
  const cached = getCached<LiveVersion[]>("vanilla");
  if (cached) return cached;

  const manifest = await httpFetch(MOJANG_MANIFEST);

  const versions: LiveVersion[] = manifest.versions.map(
    (v: any): LiveVersion => ({
      id: v.id,
      type:
        v.type === "release"
          ? "Release"
          : v.type === "snapshot"
            ? "Snapshot"
            : v.type,
      loaderType: "vanilla",
      releaseTime: v.releaseTime,
      stable: v.type === "release",
    }),
  );

  setCache("vanilla", versions);
  return versions;
}

/* ------------------------------------------------------------------ */
/*  Fabric                                                             */
/* ------------------------------------------------------------------ */

const FABRIC_META = "https://meta.fabricmc.net";

export async function fetchFabricVersions(): Promise<LiveVersion[]> {
  const cached = getCached<LiveVersion[]>("fabric");
  if (cached) return cached;

  const [games, loaders] = await Promise.all([
    httpFetch(`${FABRIC_META}/v2/versions/game`),
    httpFetch(`${FABRIC_META}/v2/versions/loader`),
  ]);

  const latestLoader = loaders[0];

  const versions: LiveVersion[] = games.map(
    (g: any): LiveVersion => ({
      id: `Fabric ${g.version} (${latestLoader?.version ?? "?"})`,
      type: g.stable ? "Release" : "Snapshot",
      loaderType: "fabric",
      releaseTime: new Date().toISOString(),
      stable: g.stable,
    }),
  );

  setCache("fabric", versions);
  return versions;
}

/* ------------------------------------------------------------------ */
/*  NeoForge (active successor to Forge, MC 1.20.2+)                   */
/* ------------------------------------------------------------------ */

const NEOFORGE_DEPOT =
  "https://depot.neoforged.net/meta/v1/minecraft-versions.json";

export async function fetchNeoForgeVersions(): Promise<LiveVersion[]> {
  const cached = getCached<LiveVersion[]>("neoforge");
  if (cached) return cached;

  try {
    const data = await httpFetch(NEOFORGE_DEPOT);

    const versions: LiveVersion[] = data.versions.map(
      (v: any): LiveVersion => ({
        id: `NeoForge ${v.neoforge_version} (MC ${v.version})`,
        type:
          v.type === "release"
            ? "Release"
            : v.type === "snapshot"
              ? "Snapshot"
              : v.type,
        loaderType: "neoforge",
        releaseTime: v.released,
        stable: v.type === "release",
      }),
    );

    setCache("neoforge", versions);
    return versions;
  } catch {
    // ponytail: NeoForge depot may be unavailable — return empty, UI handles it
    return [];
  }
}
