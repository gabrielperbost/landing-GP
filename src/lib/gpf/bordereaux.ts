import "server-only";
import zlib from "node:zlib";

// ---------------------------------------------------------------------------
// Lecture des fichiers de bordereau (CSV et Excel .xlsx), sans dépendance
// externe : un .xlsx est une archive zip de fichiers XML.
// ---------------------------------------------------------------------------

export type Table = { colonnes: string[]; lignes: string[][] };

export function parseCsv(texte: string): Table {
  const t = texte.replace(/^﻿/, "");
  const premiere = t.split(/\r?\n/)[0] ?? "";
  const sep = [";", ",", "\t"].sort((a, b) => premiere.split(b).length - premiere.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"' && t[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return enTable(rows);
}

function enTable(rows: string[][]): Table {
  // La ligne d'en-tête est la première qui contient au moins 3 cellules remplies.
  const idx = rows.findIndex((r) => r.filter((c) => c).length >= 3);
  if (idx < 0) return { colonnes: [], lignes: [] };
  const colonnes = rows[idx].map((c, i) => c || `Colonne ${i + 1}`);
  return { colonnes, lignes: rows.slice(idx + 1).map((r) => colonnes.map((_, i) => r[i] ?? "")) };
}

function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("fichier_excel_illisible");
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    const lNameLen = buf.readUInt16LE(local + 26);
    const lExtraLen = buf.readUInt16LE(local + 28);
    const start = local + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + compSize);
    if (/^xl\/(sharedStrings|workbook)\.xml$|^xl\/worksheets\/sheet\d+\.xml$|^xl\/_rels\/workbook\.xml\.rels$/.test(name)) {
      files.set(name, method === 8 ? zlib.inflateRawSync(data) : data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");

const colIndex = (ref: string) => {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export function parseXlsx(buf: Buffer): Table {
  const files = unzip(buf);
  const shared: string[] = [];
  const ss = files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    shared.push(decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
  }
  const sheetName = [...files.keys()].filter((k) => k.startsWith("xl/worksheets/")).sort()[0];
  if (!sheetName) throw new Error("fichier_excel_vide");
  const xml = files.get(sheetName)!.toString("utf8");
  const rows: string[][] = [];
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const inner = c[2] ?? "";
      const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
      const type = attrs.match(/t="(\w+)"/)?.[1];
      let val = "";
      if (type === "inlineStr") val = decodeXml([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""));
      else {
        const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        val = type === "s" ? shared[Number(v)] ?? "" : decodeXml(v);
      }
      const i = ref ? colIndex(ref) : row.length;
      while (row.length < i) row.push("");
      row[i] = val.trim();
    }
    if (row.some((x) => x)) rows.push(row);
  }
  return enTable(rows);
}

// ---------------------------------------------------------------------------
// Mappage des colonnes : proposé à partir des intitulés, mémorisé par compagnie.
// ---------------------------------------------------------------------------

export const CHAMPS = ["client", "reference_contrat", "date_effet", "periode", "base", "taux", "montant", "type"] as const;
export type Champ = (typeof CHAMPS)[number];
export type Mapping = Partial<Record<Champ, string>>;
export const CHAMP_LABEL: Record<Champ, string> = {
  client: "Client (nom de l'assuré)",
  reference_contrat: "N° de contrat",
  date_effet: "Date d'effet",
  periode: "Période",
  base: "Base (cotisation encaissée)",
  taux: "Taux",
  montant: "Montant de la commission",
  type: "Type (nouvelle affaire / récurrent)"
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const INDICES: Record<Champ, RegExp> = {
  client: /(assure|client|souscripteur|adherent|nom)/,
  reference_contrat: /(contrat|police|n.?\s?adh|numero|reference)/,
  date_effet: /(effet|date d.?effet|souscription)/,
  periode: /(periode|echeance|mois|du |au )/,
  base: /(base|cotisation|prime|assiette|encaiss)/,
  taux: /(taux|%)/,
  montant: /(commission|montant|remuneration|net a payer|a payer)/,
  type: /(type|nature|libelle|motif)/
};

export function proposerMapping(colonnes: string[]): Mapping {
  const mapping: Mapping = {};
  const prises = new Set<string>();
  for (const champ of ["montant", "taux", "base", "reference_contrat", "date_effet", "periode", "type", "client"] as Champ[]) {
    const col = colonnes.find((c) => !prises.has(c) && INDICES[champ].test(norm(c)));
    if (col) {
      mapping[champ] = col;
      prises.add(col);
    }
  }
  return mapping;
}

// ---------------------------------------------------------------------------
// Normalisation d'une ligne et rapprochement avec un contrat.
// ---------------------------------------------------------------------------

export type LigneNormalisee = {
  client_nom_brut: string;
  reference_contrat: string | null;
  date_effet: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
  base_commission: number | null;
  taux: number | null;
  montant: number;
  type_commission: "nouvelle_affaire" | "recurrent_lineaire" | "frais_dossier" | "remuneration_apporteur" | "decommission";
  brut: Record<string, string>;
};

export function nombre(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = v.replace(/\s|€| /g, "").replace(/%$/, "");
  if (!s) return null;
  const clean = s.includes(",") && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

export function dateIso(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}-01`;
  const serial = Number(s);
  if (Number.isFinite(serial) && serial > 20000 && serial < 70000) {
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function typeCommission(brut: string, montant: number): LigneNormalisee["type_commission"] {
  const t = norm(brut);
  if (montant < 0 || /(reprise|decommission|annulation|rembours)/.test(t)) return "decommission";
  if (/(frais)/.test(t)) return "frais_dossier";
  if (/(apporteur|retrocession)/.test(t)) return "remuneration_apporteur";
  if (/(recurrent|suivi|stock|lineaire|renouvel|gestion)/.test(t)) return "recurrent_lineaire";
  return "nouvelle_affaire";
}

export function normaliserLigne(colonnes: string[], ligne: string[], mapping: Mapping): LigneNormalisee | null {
  const get = (champ: Champ) => {
    const col = mapping[champ];
    if (!col) return "";
    const i = colonnes.indexOf(col);
    return i >= 0 ? ligne[i] ?? "" : "";
  };
  const base = nombre(get("base"));
  let taux = nombre(get("taux"));
  if (taux != null && taux > 1 && taux <= 100) taux = taux / 100;
  const montant = nombre(get("montant")) ?? (base != null && taux != null ? Math.round(base * taux * 100) / 100 : null);
  const client = get("client").trim();
  if (montant == null || (!client && !get("reference_contrat"))) return null;
  const periode = get("periode");
  const dates = periode.match(/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}[/.-]\d{4}|\d{4}-\d{2}-\d{2}/g) ?? [];
  return {
    client_nom_brut: client,
    reference_contrat: get("reference_contrat").trim() || null,
    date_effet: dateIso(get("date_effet")),
    periode_debut: dateIso(dates[0]) ?? dateIso(periode),
    periode_fin: dateIso(dates[1] ?? dates[0]) ?? dateIso(periode),
    base_commission: base,
    taux,
    montant,
    type_commission: typeCommission(get("type"), montant),
    brut: Object.fromEntries(colonnes.map((c, i) => [c, ligne[i] ?? ""]))
  };
}

export const normNom = (s: string) =>
  norm(s)
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !["mr", "mme", "m", "monsieur", "madame"].includes(t))
    .sort()
    .join(" ");
export const normRef = (s: string | null | undefined) => (s ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
