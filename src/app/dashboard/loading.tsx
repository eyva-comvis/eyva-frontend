import { EyvaLoadingView } from "@/components/ui/EyvaStateView";

export default function DashboardLoading() {
  return (
    <EyvaLoadingView
      title="Preparing your study space…"
      subtitle="Loading your focus dashboard and study tools."
      showDashboardSkeleton
    />
  );
}
