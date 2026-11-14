import { createFileRoute, redirect } from "@tanstack/react-router";

// Android WebView may retain the bundled entry filename as its initial route.
// Map that physical APK entry point to the real home route.
export const Route = createFileRoute("/index/html")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
