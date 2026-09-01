"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("common");
  const cancel = cancelLabel ?? t("cancel");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onCancel();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel, pending]);

  return (
    <div className="dialog-root">
      <button
        type="button"
        className="dialog-backdrop"
        aria-label={t("close")}
        disabled={pending}
        onClick={onCancel}
      />
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {message}
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            onClick={onCancel}
          >
            {cancel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? t("working") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
