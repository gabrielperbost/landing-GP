"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GpfLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/gpf/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setError("Mot de passe incorrect.");
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
