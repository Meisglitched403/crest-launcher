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


/* -------- Modpacks -------- */
export type ModpackStatus =
  "installed" | "update-available" | "not-installed" | "installing";
export type Modpack = {
  id: string;
  name: string;
  author: string;
  desc: string;
  icon?: string;
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
    icon: "https://cdn.modrinth.com/data/shFhR8Vx/a19c2bcb51d38f32f138d3607e91cb2b7b8e387f_96.webp",
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
    icon: "https://cdn.modrinth.com/data/EGs3lC8D/00f31f1b678ed4cf3aee8c3aee79889afb4b8a1c_96.webp",
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
    icon: "https://cdn.modrinth.com/data/Aa5L6RtV/2d323306d1e5909c81b3da0d57e9899383106f77_96.webp",
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
