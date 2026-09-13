import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/counsellor/")({
  beforeLoad: () => {
    throw redirect({ to: "/counsellor/login", replace: true });
  },
});
