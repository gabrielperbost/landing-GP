"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/gpf/clients", label: "Clients" }
  // D'autres entrées (dossiers, commissions, dashboard) arriveront aux prochaines étapes.
];

export function GpfNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/gpf/auth", { method: "DELETE" });
    router.replace("/gpf/login");
    router.refresh();
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        background: "#0d1f3c",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <strong style={{ letterSpacing: "-0.02em" }}>GPF</strong>
        <nav style={{ display: "flex", gap: 14 }}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: pathname?.startsWith(link.href) ? "#e8c97a" : "#c0c8d1",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: pathname?.startsWith(link.href) ? 600 : 400
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        onClick={logout}
        style={{ background: "transparent", border: "1px solid #ffffff40", color: "#fff", borderRadius: 100, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
      >
        Déconnexion
      </button>
    </header>
  );
}
