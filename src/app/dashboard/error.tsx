"use client";

import { useEffect } from "react";
import { EyvaErrorView } from "@/components/ui/EyvaStateView";

export default function DashboardError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("EYVA dashboard error boundary:", error);
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
      eyebrow={isNetwork ? "CONNECTION ISSUE" : "STUDY SPACE INTERRUPTED"}
      title={isNetwork ? "Server didn't respond in time" : "We hit a small snag"}
      description={
        isNetwork
          ? "Your connection looks slow or the Eyva backend is taking too long to respond. Try again or return to Home."
          : "Something unexpected happened while loading your study dashboard. Let's try that again."
      }
      onRetry={() => reset()}
      retryLabel="Try again"
      homeHref="/dashboard/home"
      homeLabel="Back to Home"
      variant={isNetwork ? "network" : "error"}
    />
  );
}
