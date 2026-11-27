"use client";

import { PageTransition } from "@/components/motion/MotionPrimitives";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition className="w-full flex-1">{children}</PageTransition>;
}
