"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog } from "@/components/Dialog";
import { Pagination } from "@/components/Pagination";
import { ApiError, api } from "@/lib/api";
import { usePagination } from "@/lib/pagination";
import { LevelBadge, StatusBadge } from "@/components/Badges";
import type { MembershipLevel, Resource } from "@/lib/types";

const LEVELS: MembershipLevel[] = ["SILVER", "GOLD", "PLATINUM"];
const EMPTY_CREATE = {
  name: "",
  family: "",
  minLevel: "SILVER" as MembershipLevel,
};

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export default function ResourcesPage() {
  const t = useTranslations("resources");
  const tCommon = useTranslations("common");
  const tLevels = useTranslations("levels");
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState<Resource | null>(null);
  const [retiring, setRetiring] = useState(false);
  const [search, setSearch] = useState({
    name: "",
    family: "",
    minLevel: "",
  });
  const [form, setForm] = useState(EMPTY_CREATE);

  async function load() {
    const data = await api<{ resources: Resource[] }>("/api/resources");
    setResources(data.resources);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : t("loadFailed")),
    );
  }, []);

  const filtered = useMemo(
    () =>
      resources.filter((resource) => {
        if (search.name && !matches(resource.name, search.name)) return false;
        if (search.family && !matches(resource.family, search.family)) return false;
        if (search.minLevel && resource.minLevel !== search.minLevel) return false;
        return true;
      }),
    [resources, search],
  );
  const list = usePagination(filtered);

  function closeCreate() {
    if (pending) return;
    setCreating(false);
    setFormError("");
    setForm(EMPTY_CREATE);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setPending(true);
    try {
      await api("/api/resources", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(EMPTY_CREATE);
      setCreating(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("provisionFailed"));
    } finally {
      setPending(false);
    }
  }

  async function decommission(resource: Resource) {
    setError("");
    setRetiring(true);
    try {
      await api(`/api/resources/${resource.id}/decommission`, { method: "POST" });
      setConfirming(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("decommissionFailed"));
    } finally {
      setRetiring(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-toolbar">
          <h2 className="section-title">{t("searchTitle")}</h2>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setFormError("");
              setCreating(true);
            }}
          >
            {t("add")}
          </button>
        </div>
        <div className="row">
          <label className="field">
            <span>{tCommon("name")}</span>
            <input
              value={search.name}
              onChange={(e) => setSearch({ ...search, name: e.target.value })}
              placeholder={t("searchName")}
            />
          </label>
          <label className="field">
            <span>{tCommon("family")}</span>
            <input
              value={search.family}
              onChange={(e) => setSearch({ ...search, family: e.target.value })}
              placeholder={t("searchFamily")}
            />
          </label>
          <label className="field">
            <span>{t("minimumLevel")}</span>
            <select
              value={search.minLevel}
              onChange={(e) => setSearch({ ...search, minLevel: e.target.value })}
            >
              <option value="">{tCommon("all")}</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {tLevels(level)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tCommon("resource")}</th>
              <th>{tCommon("family")}</th>
              <th>{tCommon("minLevel")}</th>
              <th>{tCommon("status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td data-label="" colSpan={5} className="muted">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              list.slice.map((resource) => (
                <tr key={resource.id}>
                  <td data-label={tCommon("resource")}>{resource.name}</td>
                  <td data-label={tCommon("family")}>{resource.family}</td>
                  <td data-label={tCommon("minLevel")}>
                    <LevelBadge level={resource.minLevel} />
                  </td>
                  <td data-label={tCommon("status")}>
                    <StatusBadge status={resource.status} />
                  </td>
                  <td data-label="">
                    {resource.status === "ACTIVE" ? (
                      <button
                        className="btn-danger"
                        type="button"
                        onClick={() => setConfirming(resource)}
                      >
                        {t("decommission")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={list.page}
        pageCount={list.pageCount}
        pageSize={list.pageSize}
        total={list.total}
        from={list.from}
        to={list.to}
        onPage={list.setPage}
        onPageSize={list.setPageSize}
      />
      {creating ? (
        <Dialog
          title={t("provisionTitle")}
          pending={pending}
          wide
          onClose={closeCreate}
        >
          <form className="stack" onSubmit={onCreate}>
            <label className="field">
              <span>{tCommon("name")}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span>{tCommon("family")}</span>
              <input
                value={form.family}
                onChange={(e) => setForm({ ...form, family: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>{t("minimumLevel")}</span>
              <select
                value={form.minLevel}
                onChange={(e) =>
                  setForm({ ...form, minLevel: e.target.value as MembershipLevel })
                }
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {tLevels(level)}
                  </option>
                ))}
              </select>
            </label>
            {formError ? <p className="error">{formError}</p> : null}
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pending}
                onClick={closeCreate}
              >
                {tCommon("cancel")}
              </button>
              <button className="btn" disabled={pending} type="submit">
                {pending ? tCommon("adding") : t("addSubmit")}
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          title={t("decommissionTitle")}
          message={t("decommissionMessage", { name: confirming.name })}
          confirmLabel={t("decommission")}
          pending={retiring}
          onCancel={() => {
            if (!retiring) setConfirming(null);
          }}
          onConfirm={() => decommission(confirming)}
        />
      ) : null}
    </div>
  );
}
