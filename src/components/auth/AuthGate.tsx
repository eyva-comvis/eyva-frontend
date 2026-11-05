"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, hasSession } from "@/lib/authStorage";

/**
 * `require="user"`: halaman hanya untuk yang sudah login (selain itu ke /login).
 * `require="guest"`: halaman login/daftar; pengguna yang sudah login langsung ke Home.
 */
export default function AuthGate({
  require,
  children,
}: {
  require: "user" | "guest";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const loggedIn = hasSession();
    if (require === "user" && !loggedIn) {
      clearAuth();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (require === "guest" && loggedIn) {
      router.replace("/dashboard/home");
      return;
    }
    setAllowed(true);
  }, [require, router, pathname]);

  if (!allowed) {
    return <div className="min-h-screen w-full bg-white" aria-busy="true" />;
  }
  return <>{children}</>;
}
