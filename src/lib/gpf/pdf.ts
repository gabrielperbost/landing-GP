import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CABINET, MENTIONS_LEGALES } from "@/lib/gpf/cabinet";

// ---------------------------------------------------------------------------
// Générateur PDF minimal (pdf-lib, déjà installé, aucun service payant) pour
// les documents du cabinet : DER, lettre de mission, recueil, rapport,
// courriers. Mise en page sobre aux couleurs GP Finances.
// ---------------------------------------------------------------------------

const W = 595.28;
const H = 841.89;
const MX = 56;
const NAVY = rgb(7 / 255, 28 / 255, 44 / 255);
const GOLD = rgb(205 / 255, 170 / 255, 90 / 255);
const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.42, 0.45, 0.5);

export type Bloc =
  | { t: "titre"; texte: string }
  | { t: "sousTitre"; texte: string }
  | { t: "para"; texte: string; gras?: boolean; petit?: boolean }
  | { t: "liste"; items: string[] }
  | { t: "champs"; lignes: [string, string][] }
  | { t: "signatures"; gauche: string; droite: string }
  | { t: "adresse"; lignes: string[] }
  | { t: "espace"; h?: number };

/** Ramène le texte aux caractères de la police standard (WinAnsi). */
const propre = (s: string) =>
  s
    .replace(/[   ]/g, " ")
    .replace(/[‐‑]/g, "-")
    .replace(/[^\x20-\x7e\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\n]/g, "");

function couper(texte: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  for (const para of propre(texte).split("\n")) {
    let ligne = "";
    for (const mot of para.split(/\s+/)) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (font.widthOfTextAtSize(essai, size) <= max || !ligne) ligne = essai;
      else {
        out.push(ligne);
        ligne = mot;
      }
    }
    out.push(ligne);
  }
  return out;
}

/** `cabinet: false` pour un courrier écrit au nom du client (sans en-tête ni mentions du cabinet). */
export async function genererPdf(titreDoc: string, blocs: Bloc[], opts: { cabinet?: boolean } = {}): Promise<Uint8Array> {
  const avecCabinet = opts.cabinet !== false;
  const pdf = await PDFDocument.create();
  pdf.setTitle(propre(titreDoc));
  pdf.setAuthor(CABINET.nom);
  const f = await pdf.embedFont(StandardFonts.Helvetica);
  const fb = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fs = await pdf.embedFont(StandardFonts.TimesRoman);
  let page: PDFPage = null as unknown as PDFPage;
  let y = 0;
  const larg = W - 2 * MX;

  const nouvellePage = () => {
    page = pdf.addPage([W, H]);
    if (!avecCabinet) {
      y = H - 60;
      return;
    }
    page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: NAVY });
    page.drawText(CABINET.nom.toUpperCase(), { x: MX, y: H - 40, size: 11, font: fb, color: NAVY });
    page.drawText(propre(`${CABINET.qualite} · ORIAS ${CABINET.orias}`), { x: MX, y: H - 54, size: 8, font: f, color: MUTED });
    page.drawLine({ start: { x: MX, y: H - 64 }, end: { x: W - MX, y: H - 64 }, thickness: 0.6, color: GOLD });
    y = H - 92;
  };
  const place = (h: number) => {
    if (y - h < 70) nouvellePage();
  };
  const lignes = (texte: string, font: PDFFont, size: number, color = INK, x = MX, max = larg, interligne = 1.45) => {
    for (const l of couper(texte, font, size, max)) {
      place(size * interligne);
      page.drawText(l, { x, y: y - size, size, font, color });
      y -= size * interligne;
    }
  };

  nouvellePage();
  for (const b of blocs) {
    switch (b.t) {
      case "titre":
        place(40);
        y -= 6;
        lignes(b.texte, fs, 20, NAVY, MX, larg, 1.3);
        y -= 10;
        break;
      case "sousTitre":
        place(34);
        y -= 10;
        lignes(b.texte.toUpperCase(), fb, 9.5, NAVY);
        page.drawLine({ start: { x: MX, y: y + 4 }, end: { x: MX + 40, y: y + 4 }, thickness: 1, color: GOLD });
        y -= 6;
        break;
      case "para":
        lignes(b.texte, b.gras ? fb : f, b.petit ? 8.5 : 10, b.petit ? MUTED : INK);
        y -= 5;
        break;
      case "liste":
        for (const item of b.items) {
          place(14);
          page.drawText("•", { x: MX + 4, y: y - 10, size: 10, font: f, color: GOLD });
          lignes(item, f, 10, INK, MX + 16, larg - 16);
        }
        y -= 4;
        break;
      case "champs":
        for (const [k, v] of b.lignes) {
          const vals = couper(v || "—", f, 10, larg - 170);
          place(14 * vals.length);
          page.drawText(propre(k), { x: MX, y: y - 10, size: 9, font: fb, color: MUTED });
          vals.forEach((l, i) => page.drawText(l, { x: MX + 170, y: y - 10 - i * 14, size: 10, font: f, color: INK }));
          y -= 14 * vals.length + 3;
        }
        y -= 4;
        break;
      case "adresse":
        for (const l of b.lignes) {
          place(14);
          page.drawText(propre(l), { x: W - MX - 220, y: y - 10, size: 10, font: f, color: INK });
          y -= 14;
        }
        y -= 10;
        break;
      case "signatures": {
        place(110);
        y -= 16;
        const col = larg / 2 - 10;
        page.drawText(propre(b.gauche), { x: MX, y: y - 10, size: 9, font: fb, color: MUTED });
        page.drawText(propre(b.droite), { x: MX + col + 20, y: y - 10, size: 9, font: fb, color: MUTED });
        page.drawText("Date et signature :", { x: MX, y: y - 26, size: 8.5, font: f, color: MUTED });
        page.drawText("Date et signature :", { x: MX + col + 20, y: y - 26, size: 8.5, font: f, color: MUTED });
        page.drawRectangle({ x: MX, y: y - 96, width: col, height: 62, borderColor: GOLD, borderWidth: 0.6 });
        page.drawRectangle({ x: MX + col + 20, y: y - 96, width: col, height: 62, borderColor: GOLD, borderWidth: 0.6 });
        y -= 110;
        break;
      }
      case "espace":
        y -= b.h ?? 12;
        break;
    }
  }

  // Pied de page : mentions légales et pagination.
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    if (avecCabinet) couper(MENTIONS_LEGALES, f, 7, larg).forEach((l, j) => p.drawText(l, { x: MX, y: 40 - j * 9, size: 7, font: f, color: MUTED }));
    p.drawText(`${i + 1} / ${pages.length}`, { x: W - MX - 20, y: 22, size: 7, font: f, color: MUTED });
  });
  return pdf.save();
}
