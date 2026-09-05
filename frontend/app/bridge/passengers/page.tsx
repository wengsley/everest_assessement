"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/Dialog";
import { Pagination } from "@/components/Pagination";
import { ApiError, api } from "@/lib/api";
import { usePagination } from "@/lib/pagination";
import { LevelBadge } from "@/components/Badges";
import type { MembershipLevel, PublicUser } from "@/lib/types";

const LEVELS: MembershipLevel[] = ["SILVER", "GOLD", "PLATINUM"];
const EMPTY_CREATE = {
  name: "",
  email: "",
  password: "cabin-7a",
  level: "SILVER" as MembershipLevel,
};

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export default function PassengersPage() {
  const t = useTranslations("passengers");
  const tCommon = useTranslations("common");
  const tLevels = useTranslations("levels");
  const [passengers, setPassengers] = useState<PublicUser[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState({
    name: "",
    email: "",
    level: "",
  });
  const [form, setForm] = useState(EMPTY_CREATE);

  async function load() {
    const data = await api<{ passengers: PublicUser[] }>("/api/passengers");
    setPassengers(data.passengers);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : t("loadFailed")),
    );
  }, []);

  const filtered = useMemo(
    () =>
      passengers.filter((passenger) => {
        if (search.name && !matches(passenger.name, search.name)) return false;
        if (search.email && !matches(passenger.email, search.email)) return false;
        if (search.level && passenger.level !== search.level) return false;
        return true;
      }),
    [passengers, search],
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
      await api("/api/passengers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(EMPTY_CREATE);
      setCreating(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("createFailed"));
    } finally {
      setPending(false);
    }
  }

  async function changeLevel(id: string, level: MembershipLevel) {
    setError("");
    try {
      await api(`/api/passengers/${id}/level`, {
        method: "PATCH",
        body: JSON.stringify({ level }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("levelFailed"));
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
            <span>{tCommon("email")}</span>
            <input
              type="email"
              value={search.email}
              onChange={(e) => setSearch({ ...search, email: e.target.value })}
              placeholder={t("searchEmail")}
            />
          </label>
          <label className="field">
            <span>{tCommon("level")}</span>
            <select
              value={search.level}
              onChange={(e) => setSearch({ ...search, level: e.target.value })}
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
              <th>{tCommon("passenger")}</th>
              <th>{tCommon("email")}</th>
              <th>{tCommon("level")}</th>
              <th>{t("upgrade")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td data-label="" colSpan={4} className="muted">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              list.slice.map((passenger) => (
                <tr key={passenger.id}>
                  <td data-label={tCommon("passenger")}>{passenger.name}</td>
                  <td data-label={tCommon("email")} className="mono">
                    {passenger.email}
                  </td>
                  <td data-label={tCommon("level")}>
                    {passenger.level ? <LevelBadge level={passenger.level} /> : "—"}
                  </td>
                  <td data-label={t("upgrade")}>
                    <select
                      value={passenger.level ?? "SILVER"}
                      onChange={(e) =>
                        changeLevel(passenger.id, e.target.value as MembershipLevel)
                      }
                    >
                      {LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {tLevels(level)}
                        </option>
                      ))}
                    </select>
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
          title={t("createTitle")}
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
              <span>{tCommon("email")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>{tCommon("password")}</span>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </label>
            <label className="field">
              <span>{tCommon("level")}</span>
              <select
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: e.target.value as MembershipLevel })
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
                {pending ? tCommon("adding") : t("add")}
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
