"use client";

import { Shell } from "@/components/Shell";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BridgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tTitle = useTranslations("titles");

  if (!ready || user?.role !== "CREW_LEAD") {
    return <div className="app-shell" />;
  }

  const nav = [
    { href: "/bridge", label: tNav("overview") },
    { href: "/bridge/passengers", label: tNav("passengers") },
    { href: "/bridge/resources", label: tNav("resources") },
    { href: "/bridge/activity", label: tNav("activity") },
    { href: "/bridge/reports", label: tNav("reports") },
  ];

  const titles: Record<string, string> = {
    "/bridge": tTitle("overview"),
    "/bridge/passengers": tTitle("passengers"),
    "/bridge/resources": tTitle("resources"),
    "/bridge/activity": tTitle("activity"),
    "/bridge/reports": tTitle("reports"),
  };

  return (
    <Shell title={titles[pathname] ?? tNav("bridge")} nav={nav}>
      {children}
    </Shell>
  );
}
