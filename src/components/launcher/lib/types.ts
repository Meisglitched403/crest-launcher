import type { useModpacks } from "@/hooks/use-modpacks";
import type { useOfflineProfiles } from "@/hooks/use-offline-profiles";
import type { SessionResult } from "@/lib/tauri-commands";

export type ModpacksHook = ReturnType<typeof useModpacks>;
export type ProfilesHook = ReturnType<typeof useOfflineProfiles>;
export type { SessionResult };

export type ViewProps = {
  modpacks: ModpacksHook;
  profiles: ProfilesHook;
  launching: boolean;
  setLaunching: (v: boolean) => void;
  gameRunning: boolean;
  setGameRunning: (v: boolean) => void;
  session: SessionResult | null;
  backendOnline: boolean;
};
