"use client";

import { FormEvent, useState } from "react";
import { CONFIG } from "@/content/site";
import { trackLead } from "@/lib/tracking";
import { Button } from "../ui/Button";

export const LeadForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch(CONFIG.LEAD_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "landing",
          timestamp: new Date().toISOString()
        })
      });
      setStatus("success");
      trackLead("submitted");
    } catch (err) {
      console.error(err);
      setStatus("error");
      trackLead("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="sr-only" htmlFor="lead-email">
        Email
      </label>
      <input
        id="lead-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email pro"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "success" ? "Envoyé" : status === "loading" ? "Envoi..." : "Lancer l’estimation gratuite"}
      </Button>
      {status === "error" && <p className="text-sm text-red-600">Une erreur est survenue. Réessayez.</p>}
      {status === "success" && <p className="text-sm text-emerald-600">Merci ! Nous revenons vers vous.</p>}
    </form>
  );
};
