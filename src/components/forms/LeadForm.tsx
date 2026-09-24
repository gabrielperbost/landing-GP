"use client";

import { FormEvent, useState } from "react";
import { CONFIG } from "@/content/site";
import { trackLead } from "@/lib/tracking";
import { getCitySlugFromPath } from "@/lib/pageContext";
import { Button } from "../ui/Button";

const getLeadTrackingContext = () => {
  if (typeof window === "undefined") {
    return { source: "landing", pagePath: "", citySlug: "" };
  }

  const pagePath = window.location.pathname || "/";
  const citySlug = getCitySlugFromPath(pagePath);
  const searchParams = new URLSearchParams(window.location.search);
  const referrerHost = (() => {
    try {
      return document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      return "";
    }
  })();

  const sourceParts = [
    "channel:landing",
    `path:${pagePath}`,
    citySlug ? `city:${citySlug}` : "",
    searchParams.get("utm_source") ? `utm_source:${searchParams.get("utm_source")}` : "",
    searchParams.get("utm_medium") ? `utm_medium:${searchParams.get("utm_medium")}` : "",
    searchParams.get("utm_campaign") ? `utm_campaign:${searchParams.get("utm_campaign")}` : "",
    searchParams.get("utm_term") ? `utm_term:${searchParams.get("utm_term")}` : "",
    searchParams.get("utm_content") ? `utm_content:${searchParams.get("utm_content")}` : "",
    searchParams.get("gclid") ? `gclid:${searchParams.get("gclid")}` : "",
    searchParams.get("fbclid") ? `fbclid:${searchParams.get("fbclid")}` : "",
    referrerHost ? `referrer:${referrerHost}` : ""
  ].filter(Boolean);

  return {
    source: sourceParts.join("|"),
    pagePath,
    citySlug
  };
};

export const LeadForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Une erreur est survenue. Réessayez.");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    const tracking = getLeadTrackingContext();

    setStatus("loading");
    setErrorMessage("Une erreur est survenue. Réessayez.");
    try {
      const response = await fetch(CONFIG.LEAD_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          source: tracking.source,
          timestamp: new Date().toISOString()
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: unknown; warning?: unknown }
        | null;

      if (!response.ok) {
        const backendError =
          payload && typeof payload.error === "string"
            ? payload.error
            : `Lead submit failed (${response.status})`;
        throw new Error(backendError);
      }

      if (payload && typeof payload.warning === "string") {
        console.warn("lead-submit-warning", payload.warning);
      }

      setStatus("success");
      trackLead("submitted", {
        page_path: tracking.pagePath || "/",
        city: tracking.citySlug || "none"
      });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message) {
        setErrorMessage(err.message);
      }
      setStatus("error");
      trackLead("error", {
        page_path: tracking.pagePath || "/",
        city: tracking.citySlug || "none"
      });
    }
  };

  return (
    <form id="contact" onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1.1fr_0.9fr_0.9fr_auto] sm:items-center">
      <input
        id="lead-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom complet (optionnel)"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        aria-label="Nom complet"
      />
      <input
        id="lead-phone"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Téléphone (obligatoire)"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        aria-label="Téléphone"
      />
      <input
        id="lead-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optionnel)"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        aria-label="Email"
      />
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "success" ? "Envoyé" : status === "loading" ? "Envoi..." : "Être rappelé"}
      </Button>
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
      {status === "success" && <p className="text-sm text-emerald-600">Merci ! Nous revenons vers vous.</p>}
    </form>
  );
};
