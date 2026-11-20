import { EyvaErrorView } from "@/components/ui/EyvaStateView";

export default function NotFound() {
  return (
    <EyvaErrorView
      eyebrow="404 · PAGE NOT FOUND"
      title="We couldn't find that study spot"
      description="The page you're looking for may have moved or doesn't exist. Head back to Home to pick up where you left off."
      homeHref="/dashboard/home"
      homeLabel="Back to Home"
      variant="not-found"
    />
  );
}
