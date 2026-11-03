import { createFileRoute } from "@tanstack/react-router";
import { NewHome } from "@/components/nd/NewHome";

export const Route = createFileRoute("/")({
  component: NewHome,
});
