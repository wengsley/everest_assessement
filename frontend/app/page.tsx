"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CREW = [
  ["captain@mail.com", "Captain Imani Cole"],
  ["navigator@mail.com", "Navigator Sol Park"],
  ["medic@mail.com", "Chief Medic Rhea Voss"],
];

const PASSENGERS = [
  ["ada.silver@mail.com", "Ada Mercer", "Silver"],
  ["kai.gold@mail.com", "Kai Okonkwo", "Gold"],
  ["nova.platinum@mail.com", "Nova Ellis", "Platinum"],
];

export default function LoginPage() {
  const { login, ready, user } = useAuth();
  const router = useRouter();
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("captain@mail.com");
  const [password, setPassword] = useState("bridge-7");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!ready || user) {
    return <div className="gate" />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const next = await login(email, password);
      router.push(next.role === "CREW_LEAD" ? "/bridge" : "/cabin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="gate">
      <section className="gate-copy">
        <h1>{t("headline")}</h1>
      </section>
      <section className="gate-form">
        <LanguageSwitcher />
        <form className="panel stack" onSubmit={onSubmit}>
          <div>
            <h2>{t("signIn")}</h2>
          </div>
          <label className="field">
            <span>{tCommon("email")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>{tCommon("password")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={pending}>
            {pending ? t("checking") : t("submit")}
          </button>
        </form>
        <div className="panel">
          <p className="kicker">{t("demo")}</p>
          <p className="muted small" style={{ margin: "8px 0 12px" }}>
            {t("sharedPassword")} <span className="mono">bridge-7</span>
          </p>
          <table className="cred-table">
            <thead>
              <tr>
                <th>{t("crewLead")}</th>
                <th>{tCommon("email")}</th>
              </tr>
            </thead>
            <tbody>
              {CREW.map(([mail, name]) => (
                <tr key={mail}>
                  <td>{name}</td>
                  <td className="mono">{mail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="cred-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>{tCommon("passenger")}</th>
                <th>{tCommon("email")}</th>
              </tr>
            </thead>
            <tbody>
              {PASSENGERS.map(([mail, name]) => (
                <tr key={mail}>
                  <td>{name}</td>
                  <td className="mono">{mail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
