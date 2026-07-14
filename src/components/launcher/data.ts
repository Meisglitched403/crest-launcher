import {
  Home,
  Package,
  Server,
  Palette,
  Users,
  Settings,
  Newspaper,
  Trophy,
  Gauge,
  Shield,
  FileWarning,
  Boxes,
} from "lucide-react";
import type { LiveVersion } from "@/lib/minecraft-api";

export type { LiveVersion };

export const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "versions", label: "Versions", icon: Package },
  { id: "modpacks", label: "Modpacks", icon: Boxes },
  { id: "mods", label: "Mods", icon: Shield },
  { id: "servers", label: "Servers", icon: Server },
  { id: "cosmetics", label: "Cosmetics", icon: Palette },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "crashes", label: "Crash Logs", icon: FileWarning },
  { id: "friends", label: "Friends", icon: Users },
  { id: "news", label: "News", icon: Newspaper },
  { id: "stats", label: "Stats", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type NavId = (typeof navItems)[number]["id"];

export const mods = [
  {
    name: "Sodium",
    author: "CaffeineMC",
    desc: "Modern rendering engine. Massive FPS boost.",
    downloads: "42M",
    tags: ["Performance", "Client"],
    enabled: true,
  },
  {
    name: "Iris Shaders",
    author: "IrisShaders",
    desc: "OptiFine-compatible shader pack loader.",
    downloads: "18M",
    tags: ["Shaders", "Visual"],
    enabled: true,
  },
  {
    name: "Lithium",
    author: "CaffeineMC",
    desc: "General purpose optimization mod.",
    downloads: "31M",
    tags: ["Performance"],
    enabled: true,
  },
  {
    name: "Distant Horizons",
    author: "James",
    desc: "Level-of-detail render distance up to 512 chunks.",
    downloads: "9M",
    tags: ["Visual", "World"],
    enabled: false,
  },
  {
    name: "JEI",
    author: "mezz",
    desc: "Just Enough Items — recipe & item lookup.",
    downloads: "220M",
    tags: ["Utility"],
    enabled: false,
  },
  {
    name: "ReplayMod",
    author: "CrushedPixel",
    desc: "Record, replay and cinematically render sessions.",
    downloads: "6M",
    tags: ["Creator"],
    enabled: false,
  },
];

export const servers = [
  {
    name: "Hypixel",
    ip: "mc.hypixel.net",
    players: 42381,
    max: 200000,
    ping: 24,
    version: "1.8–1.21",
    featured: true,
  },
  {
    name: "Mineplex",
    ip: "us.mineplex.com",
    players: 1203,
    max: 20000,
    ping: 48,
    version: "1.20",
  },
  {
    name: "CubeCraft",
    ip: "play.cubecraft.net",
    players: 8412,
    max: 30000,
    ping: 62,
    version: "1.21",
  },
  {
    name: "The Hive",
    ip: "play.hivemc.com",
    players: 22910,
    max: 80000,
    ping: 38,
    version: "1.20",
  },
  {
    name: "2b2t",
    ip: "2b2t.org",
    players: 517,
    max: 1000,
    ping: 88,
    version: "1.21",
    warning: true,
  },
];

export const friends = [
  {
    name: "Notch",
    status: "In-game — Hypixel Bedwars",
    online: true,
    avatar: "N",
  },
  { name: "Dream", status: "Idle in launcher", online: true, avatar: "D" },
  {
    name: "Technoblade",
    status: "In-game — SkyBlock",
    online: true,
    avatar: "T",
  },
  { name: "Grian", status: "Offline · 3h ago", online: false, avatar: "G" },
  {
    name: "Pearlescent",
    status: "Offline · yesterday",
    online: false,
    avatar: "P",
  },
];

export const cosmetics = [
  { name: "Ender Wings", type: "Wings", rarity: "Legendary", equipped: true },
  { name: "Diamond Cape", type: "Cape", rarity: "Epic", equipped: true },
  { name: "Nether Trail", type: "Particles", rarity: "Rare" },
  { name: "Crown of Crest", type: "Hat", rarity: "Legendary" },
  { name: "Bee Companion", type: "Pet", rarity: "Epic" },
  { name: "Void Dance", type: "Emote", rarity: "Rare" },
  { name: "Cyber Katana", type: "Weapon Skin", rarity: "Legendary" },
  { name: "Cloud Nine", type: "Cape", rarity: "Common" },
];

export const rarityColor: Record<string, string> = {
  Legendary: "from-amber-400 to-rose-500",
  Epic: "from-fuchsia-400 to-violet-500",
  Rare: "from-cyan-400 to-blue-500",
  Common: "from-slate-300 to-slate-500",
};

/* -------- Crash logs -------- */
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

export const crashLogs: CrashEntry[] = [
  {
    id: "crash-2026-07-14-1",
    title: "OutOfMemoryError — Java heap space",
    when: "Today · 14:22",
    version: "1.21.4",
    loader: "Fabric 0.16.9",
    exit: -1,
    severity: "fatal",
    cause: "java.lang.OutOfMemoryError: Java heap space",
    gameLog: `[14:22:03] [Render thread/INFO]: Setting user: Steve_Player
[14:22:07] [Render thread/INFO]: [Sodium] Loaded 47 mixins
[14:22:19] [Worker-Main-3/WARN]: Chunk (12, -7) took 812ms to build
[14:22:41] [Render thread/ERROR]: Unreported exception thrown!
java.lang.OutOfMemoryError: Java heap space
    at net.minecraft.world.chunk.ChunkSection.<init>(ChunkSection.java:42)
    at net.minecraft.world.chunk.WorldChunk.<init>(WorldChunk.java:118)
    at net.minecraft.server.world.ServerChunkManager.loadChunk(ServerChunkManager.java:214)
    at me.jellysquid.mods.sodium.client.render.SodiumWorldRenderer.setupTerrain(SodiumWorldRenderer.java:186)
    at net.minecraft.client.render.WorldRenderer.render(WorldRenderer.java:1024)
[14:22:41] [Render thread/INFO]: Stopping!
[14:22:42] [Render thread/INFO]: Process exited with code -1`,
    launcherLog: `[14:21:58] [Crest/INFO]: Preparing launch — profile "Modded 1.21"
[14:21:58] [Crest/INFO]: Allocated RAM: 4G (recommended: 8G)
[14:21:59] [Crest/INFO]: Assembling classpath — 62 libraries
[14:22:01] [Crest/INFO]: Spawning JVM (Java 21.0.4)
[14:22:03] [Crest/INFO]: Game window attached (pid 18422)
[14:22:41] [Crest/WARN]: Game process exited unexpectedly (-1)
[14:22:41] [Crest/INFO]: Crash report captured → crash-reports/2026-07-14_14.22.41-client.txt`,
  },
  {
    id: "crash-2026-07-13-2",
    title: "Mixin transformation failed — sodium ⇢ create",
    when: "Yesterday · 21:07",
    version: "1.20.1",
    loader: "Forge 47.3.0",
    exit: 1,
    severity: "error",
    cause: "org.spongepowered.asm.mixin.throwables.MixinApplyError",
    gameLog: `[21:07:11] [main/INFO]: ModLauncher running: args [--launchTarget, forgeclient]
[21:07:14] [main/ERROR]: Mixin apply failed sodium.mixins.json:features.chunk.ChunkBuilderMixin
org.spongepowered.asm.mixin.throwables.MixinApplyError: Mixin [sodium] from phase [DEFAULT] in config [sodium.mixins.json] FAILED during APPLY
    Caused by: java.lang.ClassCastException: class com.simibubi.create.foundation.render.ChunkBufferBuilder cannot be cast to net.minecraft.client.render.chunk.BuiltChunk
[21:07:14] [main/FATAL]: Failed to start Minecraft`,
    launcherLog: `[21:07:08] [Crest/INFO]: Launching profile "Create SMP"
[21:07:14] [Crest/ERROR]: Detected incompatible mods: Sodium 0.5.3 ↔ Create 6.0.2
[21:07:14] [Crest/INFO]: Suggested fix: use Embeddium instead of Sodium on Forge
[21:07:14] [Crest/INFO]: Process exited (1)`,
  },
  {
    id: "crash-2026-07-10-3",
    title: "Missing native library — glfw",
    when: "Jul 10 · 09:34",
    version: "1.16.5",
    loader: "Vanilla",
    exit: -1073741515,
    severity: "warn",
    cause: "UnsatisfiedLinkError: no glfw in java.library.path",
    gameLog: `[09:34:02] [main/ERROR]: java.lang.UnsatisfiedLinkError: no glfw in java.library.path
    at java.base/java.lang.ClassLoader.loadLibrary(ClassLoader.java:2434)
    at org.lwjgl.glfw.GLFW.<clinit>(GLFW.java:614)
[09:34:02] [main/INFO]: Native libraries missing — will re-download on next launch.`,
    launcherLog: `[09:33:58] [Crest/INFO]: Verifying assets for 1.16.5
[09:34:00] [Crest/WARN]: 2 native libraries missing (glfw, openal)
[09:34:02] [Crest/INFO]: Auto-repair queued`,
  },
];

/* -------- Modpacks -------- */
export type ModpackStatus =
  "installed" | "update-available" | "not-installed" | "installing";
export type Modpack = {
  id: string;
  name: string;
  author: string;
  desc: string;
  version: string;
  installedVersion?: string;
  mcVersion: string;
  loader: "Fabric" | "Forge" | "NeoForge" | "Quilt";
  size: string;
  downloads: string;
  mods: number;
  dependencies: string[];
  tag: "Adventure" | "Tech" | "Magic" | "Kitchen Sink" | "Performance";
  status: ModpackStatus;
};

export const modpacks: Modpack[] = [
  {
    id: "atm-10",
    name: "All The Mods 10",
    author: "ATM Team",
    desc: "The classic kitchen-sink pack — 400+ mods, quests, and a chapter-based progression.",
    version: "1.24",
    installedVersion: "1.22",
    mcVersion: "1.21.1",
    loader: "NeoForge",
    size: "1.8 GB",
    downloads: "8.4M",
    mods: 412,
    dependencies: ["JEI", "Curios API", "Patchouli", "Architectury"],
    tag: "Kitchen Sink",
    status: "update-available",
  },
  {
    id: "better-mc",
    name: "Better Minecraft [FABRIC]",
    author: "SHXRKIE",
    desc: "Vanilla+ overhaul — new biomes, structures, mobs and quality-of-life polish.",
    version: "7.1",
    installedVersion: "7.1",
    mcVersion: "1.21.4",
    loader: "Fabric",
    size: "920 MB",
    downloads: "12.1M",
    mods: 186,
    dependencies: ["Fabric API", "Sodium", "Iris", "YACL"],
    tag: "Adventure",
    status: "installed",
  },
  {
    id: "create-astral",
    name: "Create: Astral",
    author: "Laskyyy",
    desc: "Skyblock-style modpack built around Create, with custom questlines and stargazing.",
    version: "2.4.3",
    mcVersion: "1.20.1",
    loader: "Forge",
    size: "1.2 GB",
    downloads: "3.7M",
    mods: 248,
    dependencies: ["Create", "FTB Quests", "Ad Astra", "Modonomicon"],
    tag: "Tech",
    status: "not-installed",
  },
  {
    id: "prominence-2",
    name: "Prominence II RPG: Hasturian Era",
    author: "Hypnootic",
    desc: "Full-blown Fabric RPG — classes, dungeons, bosses, and MMO-style progression.",
    version: "3.1.16",
    mcVersion: "1.20.1",
    loader: "Fabric",
    size: "1.5 GB",
    downloads: "2.9M",
    mods: 324,
    dependencies: [
      "Fabric API",
      "Puffish Skills",
      "Better Combat",
      "Epic Fight",
    ],
    tag: "Adventure",
    status: "not-installed",
  },
  {
    id: "vault-hunters",
    name: "Vault Hunters 3rd Edition",
    author: "Iskall85",
    desc: "Rogue-lite dimension runs, loot vaults and progression across weekly seasons.",
    version: "Update 15",
    installedVersion: "Update 14",
    mcVersion: "1.18.2",
    loader: "Forge",
    size: "1.1 GB",
    downloads: "5.3M",
    mods: 267,
    dependencies: ["The Vault", "Sophisticated Backpacks", "Apotheosis"],
    tag: "Adventure",
    status: "update-available",
  },
  {
    id: "simply-optimized",
    name: "Simply Optimized",
    author: "Sk1er",
    desc: "Pure performance pack — 600+ FPS, zero content changes. Perfect vanilla+.",
    version: "1.21.4-a",
    installedVersion: "1.21.4-a",
    mcVersion: "1.21.4",
    loader: "Fabric",
    size: "38 MB",
    downloads: "1.2M",
    mods: 32,
    dependencies: ["Sodium", "Lithium", "FerriteCore", "Krypton"],
    tag: "Performance",
    status: "installed",
  },
];
