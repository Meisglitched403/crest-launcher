import { useQuery } from "@tanstack/react-query";
import {
  fetchVanillaVersions,
  fetchFabricVersions,
  fetchNeoForgeVersions,
  type LiveVersion,
} from "@/lib/minecraft-api";

const FALLBACK_VERSIONS: LiveVersion[] = [
  {
    id: "26.2",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "26.1.2",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "26.1.1",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "26.1",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.21.11",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.21.5",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.21.4",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.20.6",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.20.1",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.19.4",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
  {
    id: "1.16.5",
    type: "Release",
    loaderType: "vanilla",
    releaseTime: "",
    stable: true,
  },
];

export function useVersionData() {
  const vanilla = useQuery({
    queryKey: ["versions", "vanilla"],
    queryFn: () => fetchVanillaVersions(),
    staleTime: 300_000,
  });
  const fabric = useQuery({
    queryKey: ["versions", "fabric"],
    queryFn: () => fetchFabricVersions(),
    staleTime: 300_000,
  });
  const neoforge = useQuery({
    queryKey: ["versions", "neoforge"],
    queryFn: () => fetchNeoForgeVersions(),
    staleTime: 300_000,
  });

  const vanillaData = vanilla.data ?? FALLBACK_VERSIONS;
  const all: LiveVersion[] = [
    ...vanillaData,
    ...(fabric.data ?? []),
    ...(neoforge.data ?? []),
  ];

  const loading = vanilla.isLoading || fabric.isLoading || neoforge.isLoading;
  const error = vanilla.error || fabric.error || neoforge.error;

  return { versions: all, loading, error, vanilla, fabric, neoforge };
}
