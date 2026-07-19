export const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://127.0.0.1:8765/api";
const API = API_BASE;

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
  ramMb: number,
  profileName?: string,
  accountId?: string,
  username?: string,
  serverAddress?: string,
): Promise<LaunchResult> {
  return api<LaunchResult>("POST", "/game/launch", {
    version_id: versionId,
    ram_mb: ramMb,
    profile_name: profileName,
    account_id: accountId,
    username,
    server_address: serverAddress,
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
  categories?: string,
): Promise<any[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (gameVersion) params.set("game_version", gameVersion);
  if (loader) params.set("loader", loader);
  if (categories) params.set("categories", categories);
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

export interface UntrackedMod {
  filename: string;
}

export async function untrackedMods(modpack: string): Promise<UntrackedMod[]> {
  return api<UntrackedMod[]>("GET", `/mods/untracked?modpack=${encodeURIComponent(modpack)}`);
}

export async function adoptMod(modpack: string, filename: string): Promise<ModResult> {
  return api<ModResult>("POST", "/mods/adopt", { modpack, filename });
}

export async function createInstance(name: string, mcVersion: string, loaderType: string): Promise<void> {
  await api<{ status: string }>("POST", "/instance/create", {
    name, mc_version: mcVersion, loader_type: loaderType,
  });
}

export async function toggleMod(
  modpack: string,
  slug: string,
  enabled?: boolean,
): Promise<ModResult> {
  return api<ModResult>("POST", "/mods/toggle", { modpack, slug, enabled });
}

export async function openModsFolder(modpack: string): Promise<void> {
  await api<{ status: string }>("GET", `/mods/open-folder?modpack=${encodeURIComponent(modpack)}`);
}

export interface ServerEntry {
  name: string;
  address: string;
  version: string;
  added: number;
}

export interface PingResult {
  address: string;
  ping_ms: number | null;
  elapsed: number;
}

export async function fetchServers(): Promise<ServerEntry[]> {
  return api<ServerEntry[]>("GET", "/servers");
}

export async function addServer(name: string, address: string): Promise<ServerEntry> {
  return api<ServerEntry>("POST", "/servers/add", { name, address });
}

export async function removeServer(address: string): Promise<void> {
  await api<{ status: string }>("POST", "/servers/remove", { address });
}

export async function pingServer(address: string): Promise<PingResult> {
  return api<PingResult>("GET", `/servers/ping/${encodeURIComponent(address)}`);
}

export interface GameStatus {
  pid: number | null;
  alive: boolean;
}

export async function fetchGameStatus(): Promise<GameStatus> {
  return api<GameStatus>("GET", "/game/status");
}

export async function killGame(): Promise<{ killed: boolean }> {
  return api<{ killed: boolean }>("POST", "/game/kill");
}

export interface CrestAccount {
  id: string;
  username: string;
  display_name: string;
  mc_uuid: string;
  created_at: string;
  last_used: string;
}

export interface SessionResult {
  jwt: string;
  account: CrestAccount;
}

export interface AvailabilityResult {
  available: boolean;
  mojangMatch: unknown | null;
}

export async function signup(
  email: string,
  username: string,
  displayName: string,
  password: string,
): Promise<SessionResult> {
  return api<SessionResult>("POST", "/accounts/signup", { email, username, displayName, password });
}

export async function login(email: string, password: string): Promise<SessionResult> {
  return api<SessionResult>("POST", "/accounts/login", { email, password });
}

export async function fetchSession(): Promise<SessionResult | Record<string, never>> {
  return api<SessionResult | Record<string, never>>("GET", "/accounts/session");
}

export async function logout(): Promise<void> {
  await api<{ status: string }>("POST", "/accounts/logout");
}

export async function checkAvailability(name: string): Promise<AvailabilityResult> {
  return api<AvailabilityResult>("GET", `/accounts/check?name=${encodeURIComponent(name)}`);
}

export interface CrashEntry {
  id: string;
  title: string;
  when: string;
  version: string;
  loader: string;
  exit: number;
  severity: "fatal" | "error" | "warn";
  cause: string;
  gameLog: string;
  launcherLog: string;
}

export async function fetchLogs(): Promise<CrashEntry[]> {
  return api<CrashEntry[]>("GET", "/logs");
}

export async function openLogsFolder(): Promise<void> {
  await api<{ status: string }>("GET", "/logs/open-folder");
}

export interface HealthStatus {
  status: string;
  uptime: number;
}

export async function fetchHealth(): Promise<HealthStatus> {
  return api<HealthStatus>("GET", "/health");
}

export async function fetchIcon(project: string): Promise<string | null> {
  const data = await api<{ icon_url: string | null }>("GET", `/icon?project=${encodeURIComponent(project)}`);
  return data.icon_url;
}
