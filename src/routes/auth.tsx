import { createFileRoute, redirect } from "@tanstack/react-router";

// The music player is available locally without creating or entering an account.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
