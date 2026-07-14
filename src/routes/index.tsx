import { createFileRoute } from "@tanstack/react-router";
import { CrestLauncher } from "@/components/launcher/CrestLauncher";

export const Route = createFileRoute("/")({
  component: CrestLauncher,
});
