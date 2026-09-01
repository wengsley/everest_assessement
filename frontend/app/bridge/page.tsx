"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError, api } from "@/lib/api";
import type { PublicUser } from "@/lib/types";

export default function BridgeOverview() {
  const t = useTranslations("overview");
  const tCommon = useTranslations("common");
  const [crew, setCrew] = useState<PublicUser[]>([]);
  const [count, setCount] = useState(0);
  const [cap, setCap] = useState(3);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "Fourth Lead",
    email: "fourth@mail.com",
    password: "bridge-7",
  });

  async function load() {
    const data = await api<{
      cap: number;
      count: number;
      crewLeads: PublicUser[];
    }>("/api/crew-leads");
    setCrew(data.crewLeads);
    setCount(data.count);
    setCap(data.cap);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : t("loadFailed")),
    );
  }, []);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await api("/api/crew-leads", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("requestFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="stat">
          <span className="muted small">{t("crewLeads")}</span>
          <b>
            {count}/{cap}
          </b>
        </div>
        {/* <div className="stat">
          <span className="muted small">{t("capRule")}</span>
          <b>{t("hardLock")}</b>
        </div>
        <div className="stat">
          <span className="muted small">{t("adminExpansion")}</span>
          <b>{t("rejected")}</b>
        </div> */}
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="section-title">{t("seatedCrew")}</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{tCommon("name")}</th>
                  <th>{tCommon("email")}</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((lead) => (
                  <tr key={lead.id}>
                    <td data-label={tCommon("name")}>{lead.name}</td>
                    <td data-label={tCommon("email")} className="mono">
                      {lead.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <h2 className="section-title">{t("tryFourth")}</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            {t("tryFourthHelp")}
          </p>
          <form className="stack" onSubmit={onAdd}>
            <label className="field">
              <span>{tCommon("name")}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{tCommon("email")}</span>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{tCommon("password")}</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn btn-ghost" disabled={pending} type="submit">
              {t("provision")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
