"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type NavItem = { href: string; label: string };

export function Shell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={open ? "app-shell nav-open" : "app-shell"}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label={t("closeSidebar")}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <aside className="rail" id="ship-nav">
        <div className="rail-top">
          <div className="rail-brand">
            <div>
              <p className="rail-kicker">{t("spaceship")}</p>
              <p className="rail-title">{t("prms")}</p>
            </div>
          </div>
          <button
            type="button"
            className="menu-btn menu-btn-close"
            onClick={() => setOpen(false)}
          >
            {t("close")}
          </button>
        </div>
        <nav className="rail-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "rail-link active" : "rail-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rail-foot">
          <p className="rail-user">{user?.name}</p>
          <p className="muted small rail-email">{user?.email}</p>
          <button type="button" className="text-btn" onClick={logout}>
            {t("signOut")}
          </button>
        </div>
      </aside>
      <main className="stage">
        <header className="stage-head">
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="ship-nav"
            onClick={() => setOpen(true)}
          >
            {t("menu")}
          </button>
          <div>
            <h1>{title}</h1>
          </div>
          <LanguageSwitcher compact />
        </header>
        {children}
      </main>
    </div>
  );
}
