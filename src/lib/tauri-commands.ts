const API = "http://127.0.0.1:8765/api";

export interface JavaInfo {
  path: string;
  version: string;
}

export interface InstalledVersion {
  id: string;
  display_name: string;
  loader_type: string;
  mc_version: string;
  installed: boolean;
}

export interface LaunchResult {
  pid: number;
}

export interface ModResult {
  project_id: string;
  slug: string;
  version_id: string;
  filename: string;
  enabled: boolean;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function ensureJava(): Promise<JavaInfo> {
  return api<JavaInfo>("GET", "/java/ensure");
}

export async function installVersion(versionId: string, loaderType: string): Promise<string> {
  const data = await api<{ id: string }>("POST", "/version/install", {
    version_id: versionId,
    loader_type: loaderType,
  });
  return data.id;
}

export async function launchGame(
  versionId: string,
  username: string,
  ramMb: number,
  profileName?: string,
): Promise<LaunchResult> {
  return api<LaunchResult>("POST", "/game/launch", {
    version_id: versionId,
    username,
    ram_mb: ramMb,
    profile_name: profileName,
  });
}

export async function getInstalledVersions(): Promise<InstalledVersion[]> {
  return api<InstalledVersion[]>("GET", "/versions/installed");
}

export async function getGameDir(): Promise<string> {
  const data = await api<{ path: string }>("GET", "/game-dir");
  return data.path;
}

export async function isInstalled(versionId: string, loaderType: string): Promise<boolean> {
  const data = await api<{ installed: boolean }>(
    "GET",
    `/version/installed/${encodeURIComponent(versionId)}?loader_type=${loaderType}`,
  );
  return data.installed;
}

export async function searchMods(
  query: string,
  gameVersion?: string,
  loader?: string,
  limit = 20,
): Promise<any[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (gameVersion) params.set("game_version", gameVersion);
  if (loader) params.set("loader", loader);
  return api<any[]>("GET", `/mods/search?${params}`);
}

export async function installMod(
  modpack: string,
  slug: string,
  gameVersion?: string,
  loader = "fabric",
): Promise<ModResult> {
  return api<ModResult>("POST", "/mods/install", { modpack, slug, game_version: gameVersion, loader });
}

export async function removeMod(modpack: string, slug: string): Promise<void> {
  await api<{ status: string }>("POST", "/mods/remove", { modpack, slug });
}

export async function listMods(modpack: string): Promise<ModResult[]> {
  return api<ModResult[]>("GET", `/mods/list?modpack=${encodeURIComponent(modpack)}`);
}

export async function toggleMod(
  modpack: string,
  slug: string,
  enabled?: boolean,
): Promise<ModResult> {
  return api<ModResult>("POST", "/mods/toggle", { modpack, slug, enabled });
}
