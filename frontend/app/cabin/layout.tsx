"use client";

import { Shell } from "@/components/Shell";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CabinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tTitle = useTranslations("titles");

  if (!ready || user?.role !== "PASSENGER") {
    return <div className="app-shell" />;
  }

  return (
    <Shell
      title={
        pathname === "/cabin/history"
          ? tTitle("personalHistory")
          : tTitle("availableResources")
      }
      nav={[
        { href: "/cabin", label: tNav("cabinResources") },
        { href: "/cabin/history", label: tNav("myHistory") },
      ]}
    >
      {children}
    </Shell>
  );
}
