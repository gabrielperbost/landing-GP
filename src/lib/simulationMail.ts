import "server-only";

import nodemailer from "nodemailer";

/**
 * E-mail interne envoyé à chaque simulation d'assurance emprunteur.
 * Destinataire par défaut : gabriel.perbost@gp-finances.fr (modifiable avec SIMULATION_ALERT_TO).
 * L'envoi ne doit jamais empêcher le visiteur de voir son résultat : toute erreur est journalisée.
 */
const DEFAULT_TO = "gabriel.perbost@gp-finances.fr";
const SEND_TIMEOUT_MS = 8000;

type Person = Record<string, unknown>;
export type SimulationMailInput = {
  outcome: "quote" | "call" | "error";
  reason?: string;
  input: Record<string, unknown> | null;
  internal?: { name: string; productCode: string; contributionType: string; total: number }[];
  page?: string;
  userAgent?: string;
};

const normalizeEnv = (value: string | undefined) => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const euro = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)
    : "—";

const yn = (value: unknown) => (value === true ? "Oui" : value === false ? "Non" : "—");
const BASIS: Record<string, string> = { Variable: "Capital restant dû (CDR)", Constante: "Capital initial (CI)" };
const REASONS: Record<string, string> = {
  RISK_ANSWER: "réponse « oui » à une question de risque",
  PARTNER_REJECTED: "aucun assureur ne tarife ce profil",
  SERVICE_UNAVAILABLE: "service de tarification indisponible",
  MULTIPLE_LOANS: "plusieurs prêts",
  LOAN_TYPE: "type de prêt non standard",
  DEFERRED_LOAN: "prêt avec différé",
  REQUEST_INVALID: "données incomplètes ou incohérentes",
  INPUT_REJECTED: "données refusées par le filtre",
  PRICING_NOT_CONFIGURED: "tarification non configurée",
  PARTNER_MESSAGE: "message de l'assureur (étude nécessaire)",
  NO_VALID_PRICE: "aucun tarif exploitable"
};

const row = (label: string, value: unknown) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#5b6b7c;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0;color:#0d1f3c"><strong>${escapeHtml(value)}</strong></td></tr>`;

const personRows = (label: string, person: Person | undefined) => {
  if (!person) return "";
  return [
    row(`${label} · civilité / naissance`, `${person.title ?? "—"} · ${person.birthDate ?? "—"}`),
    row(`${label} · situation / profession`, `${person.professionalCategory ?? "—"} / ${person.profession ?? "—"}`),
    row(`${label} · quotité`, `${person.coveragePercentage ?? 100} %`),
    row(`${label} · fumeur`, yn(person.smoker)),
    row(`${label} · risques (étranger, sport, >15 000 km, hauteur, charges)`, [person.abroadTravel, person.aerialOrLandSport, person.highMileage, person.workAtHeight, person.heavyLoadHandling].map(yn).join(" / ")),
    row(`${label} · autres crédits assurés`, euro(person.remainingAccountLemoine))
  ].join("");
};

export const buildSimulationEmail = (data: SimulationMailInput, now = new Date()) => {
  const input = data.input ?? {};
  const loan = (input.loan ?? {}) as Person;
  const address = (input.address ?? {}) as Person;
  const person = input.person as Person | undefined;
  const coBorrower = input.coBorrower as Person | undefined;
  const capital = euro(loan.borrowedAmount);
  const months = loan.loanDuration ? `${loan.loanDuration} mois` : "—";
  const first = data.internal?.[0];

  const subject =
    data.outcome === "quote" && first
      ? `Simulation assurance emprunteur · ${capital} / ${months} · ${first.name} ${euro(first.total)}${coBorrower ? " · 2 emprunteurs" : ""}`
      : `Simulation à rappeler · ${capital} / ${months}${data.reason ? ` · ${REASONS[data.reason] ?? data.reason}` : ""}`;

  const solutions =
    data.outcome === "quote" && data.internal?.length
      ? `<h3 style="margin:22px 0 8px;color:#0d1f3c">Résultat affiché au visiteur</h3><table style="border-collapse:collapse;font-size:14px"><tr style="color:#5b6b7c"><td style="padding:4px 14px 4px 0">Solution</td><td style="padding:4px 14px 4px 0">Assureur (interne)</td><td style="padding:4px 14px 4px 0">Cotisations</td><td style="padding:4px 0">Coût total</td></tr>${data.internal
          .map(
            (item) =>
              `<tr><td style="padding:4px 14px 4px 0"><strong>${escapeHtml(item.name)}</strong></td><td style="padding:4px 14px 4px 0">${escapeHtml(item.productCode)}</td><td style="padding:4px 14px 4px 0">${escapeHtml(BASIS[item.contributionType] ?? item.contributionType)}</td><td style="padding:4px 0"><strong>${escapeHtml(euro(item.total))}</strong></td></tr>`
          )
          .join("")}</table>`
      : `<p style="margin:18px 0;padding:12px 14px;background:#fff4e5;border-left:3px solid #c9a227;color:#0d1f3c"><strong>Le visiteur a vu « appelez GP FINANCES ».</strong> Motif : ${escapeHtml(REASONS[data.reason ?? ""] ?? data.reason ?? "non précisé")}.</p>`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#0d1f3c;max-width:680px">
<h2 style="margin:0 0 4px">Nouvelle simulation · assurance emprunteur</h2>
<p style="margin:0 0 14px;color:#5b6b7c">${escapeHtml(now.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short" }))}</p>
${solutions}
<h3 style="margin:22px 0 8px">Ce que le visiteur a saisi</h3>
<table style="border-collapse:collapse;font-size:14px">
${row("Capital restant dû", capital)}${row("Durée restante", months)}${row("Taux du prêt", loan.interestRate !== undefined ? `${loan.interestRate} %` : "—")}${row("Projet", input.projectType)}${row("Lieu", `${address.postCode ?? ""} ${address.city ?? ""}`)}${row("Emprunteurs", coBorrower ? "2" : "1")}
${personRows("Emprunteur", person)}${personRows("Second emprunteur", coBorrower)}
</table>
<p style="margin:22px 0 0;color:#5b6b7c;font-size:12px">Page : ${escapeHtml(data.page ?? "—")}<br>Aucun nom, e-mail ni téléphone n'est collecté par ce simulateur : pour rappeler la personne, elle doit avoir pris contact par ailleurs.<br>Ces informations sont confidentielles et à conserver selon la politique de confidentialité du site.</p>
</div>`;
  return { subject, html };
};

export async function sendSimulationEmail(data: SimulationMailInput): Promise<"sent" | "skipped" | "failed"> {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  const to = (normalizeEnv(process.env.SIMULATION_ALERT_TO) ?? DEFAULT_TO).split(/[;,]/g).map((item) => item.trim()).filter(Boolean);
  if (!host || !user || !pass || !from) {
    console.warn("[simulation-mail] SMTP non configuré : e-mail non envoyé");
    return "skipped";
  }
  if (/^(1|true|yes)$/i.test(normalizeEnv(process.env.SMTP_MOCK) ?? "") && process.env.NODE_ENV !== "production") {
    console.info("[simulation-mail] mode SMTP_MOCK : e-mail non envoyé");
    return "skipped";
  }
  const port = Number(normalizeEnv(process.env.SMTP_PORT)) || 465;
  const secureRaw = normalizeEnv(process.env.SMTP_SECURE);
  const secure = secureRaw ? /^(1|true|yes)$/i.test(secureRaw) : port === 465;
  const { subject, html } = buildSimulationEmail(data);
  try {
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: SEND_TIMEOUT_MS, socketTimeout: SEND_TIMEOUT_MS });
    await transporter.sendMail({ from, to, subject, html });
    return "sent";
  } catch (error) {
    console.error("[simulation-mail] envoi impossible", error instanceof Error ? error.message : "erreur inconnue");
    return "failed";
  }
}
