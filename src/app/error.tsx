"use client";

import { useEffect } from "react";
import { EyvaErrorView } from "@/components/ui/EyvaStateView";

export default function RootError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("EYVA root error boundary:", error);
  }, [error]);

  const rawMessage =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : null;
  const isNetwork =
    rawMessage !== null &&
    /fetch|network|connect|timeout|server/i.test(rawMessage);

  return (
    <EyvaErrorView
      eyebrow={isNetwork ? "CONNECTION ISSUE" : "UNEXPECTED ERROR"}
      title={isNetwork ? "Having trouble reaching Eyva" : "Something went wrong"}
      description={
        isNetwork
          ? "The connection to the Eyva server was interrupted or timed out. Check your internet and try again."
          : "An unexpected hiccup interrupted this page. Try reloading it or head back to the home page."
      }
      onRetry={() => reset()}
      retryLabel="Try again"
      homeHref="/"
      homeLabel="Back to Home"
      variant={isNetwork ? "network" : "error"}
    />
  );
}
