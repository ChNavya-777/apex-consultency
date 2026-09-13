import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/consultation")({
  beforeLoad: () => {
    throw redirect({ to: "/consultation", replace: true });
  },
});
