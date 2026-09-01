"use client";

import { ReactNode, useEffect } from "react";
import { useTranslations } from "next-intl";

export function Dialog({
  title,
  children,
  pending = false,
  wide = false,
  onClose,
}: {
  title: string;
  children: ReactNode;
  pending?: boolean;
  wide?: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  return (
    <div className="dialog-root">
      <button
        type="button"
        className="dialog-backdrop"
        aria-label={t("close")}
        disabled={pending}
        onClick={onClose}
      />
      <div
        className={wide ? "dialog dialog-wide" : "dialog"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
