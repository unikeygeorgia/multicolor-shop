"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** Storefront chrome (header/footer) — hidden on the full-screen admin.
 *  Admin is reached either at the /admin path (local dev) or on the
 *  admin.* subdomain (where middleware rewrites every path to /admin, so
 *  the client pathname stays "/", hence the host check). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adminHost, setAdminHost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAdminHost(window.location.hostname.startsWith("admin."));
    }
  }, []);

  const isAdmin = pathname?.startsWith("/admin") || adminHost;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
