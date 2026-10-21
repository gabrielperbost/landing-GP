"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GpfLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [totpConfigured, setTotpConfigured] = useState(false);
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/gpf/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setTotpConfigured(Boolean(data.totpConfigured));
          setTotpRequired(Boolean(data.totpRequired));
        }
      })
      .catch(() => {});
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/gpf/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, totp: totp || undefined })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error === "invalid_totp" ? "Code à 6 chiffres incorrect." : "Mot de passe incorrect.");
        return;
      }
      router.replace("/gpf");
      router.refresh();
    } catch {
      setError("Service momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#071C2C" }}>
      <form
        onSubmit={submit}
        style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", width: "min(320px, 90vw)", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
      >
        <h1 style={{ fontSize: 24, margin: "0 0 4px", color: "#071C2C", fontFamily: "var(--font-gpf-serif)" }}>GP Finances</h1>
        <div style={{ height: 1, width: 32, background: "#CDAA5A", margin: "0 0 14px" }} />
        <p style={{ margin: "0 0 20px", color: "#64717d", fontSize: 14 }}>Accès réservé.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          style={{ width: "100%", padding: "11px 13px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 15, boxSizing: "border-box" }}
        />
        {totpConfigured ? (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder={totpRequired ? "Code à 6 chiffres" : "Code à 6 chiffres (si activé)"}
            style={{ width: "100%", padding: "11px 13px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 15, boxSizing: "border-box", marginTop: 10 }}
          />
        ) : null}
        {error ? <p style={{ color: "#c0392b", fontSize: 13, margin: "10px 0 0" }}>{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: 0,
            background: "#CDAA5A",
            color: "#071C2C",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading ? "default" : "pointer",
            opacity: loading || !password ? 0.6 : 1
          }}
        >
          {loading ? "..." : "Entrer"}
        </button>
      </form>
    </div>
  );
}
