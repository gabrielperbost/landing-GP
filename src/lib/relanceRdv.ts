/**
 * Campagne de relance « prise de rendez-vous » (24 novembre → 17 décembre 2026), deux e-mails par semaine
 * (mardi et jeudi, 12h), même mise en page que l'e-mail du replay.
 *  - « public »  : inscrits aux webinaires PER grand public des 11 octobre, 1er et 8 novembre.
 *  - « avocats » : inscrits au webinaire PER pour avocats du 17 septembre.
 * Objectif unique : le rendez-vous Calendly. Fil conducteur : versement PER avant le 31 décembre.
 */

export type CampagneRelance = "public" | "avocats";
export type EmailRelance = { subject: string; preheader: string; html: string; text: string };

export const RELANCE_CALENDLY = "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale";
const REPLAY_PUBLIC = "https://youtu.be/fUH6g277TVI";
const REPLAY_AVOCATS = "https://youtu.be/CYKCbu50r84";

/** Calendrier : date d'envoi (heure de Paris) → numéro de l'e-mail. */
export const RELANCE_CALENDRIER: Record<string, number> = {
  "2026-11-24": 1,
  "2026-11-26": 2,
  "2026-12-01": 3,
  "2026-12-03": 4,
  "2026-12-08": 5,
  "2026-12-10": 6,
  "2026-12-15": 7,
  "2026-12-17": 8
};

const esc = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const F = "font-family:Arial,sans-serif;";
const p = (html: string) => `<p style="margin:0 0 12px;">${html}</p>`;
const encadre = (html: string) =>
  `<div style="margin:14px 0;padding:14px 16px;background:#f5f8ff;border:1px solid #e1e9fb;border-radius:12px;${F}font-size:14px;color:#334155;line-height:1.6;">${html}</div>`;
const encadreOr = (titre: string, html: string) =>
  `<div style="margin:16px 0;padding:16px 18px;background:linear-gradient(180deg,#fbf7ec 0%,#f7f1e0 100%);border:1.5px solid #e9dcb0;border-radius:14px;">
    <div style="${F}font-weight:900;color:#0d1f3c;font-size:16px;margin:0 0 8px;">${titre}</div>
    <div style="${F}font-size:14px;color:#334155;line-height:1.6;">${html}</div>
  </div>`;
const tableau = (lignes: [string, string][], entete?: [string, string]) =>
  `<table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0;${F}font-size:14px;">
    ${entete ? `<tr><th style="text-align:left;padding:8px 10px;background:#0d1f3c;color:#fff;font-weight:700;border-radius:8px 0 0 0;">${entete[0]}</th><th style="text-align:right;padding:8px 10px;background:#0d1f3c;color:#fff;font-weight:700;border-radius:0 8px 0 0;">${entete[1]}</th></tr>` : ""}
    ${lignes
      .map(
        ([a, b], i) =>
          `<tr><td style="padding:9px 10px;border-bottom:1px solid #edf2ff;color:#334155;${i % 2 ? "background:#fafcff;" : ""}">${a}</td><td style="padding:9px 10px;border-bottom:1px solid #edf2ff;text-align:right;font-weight:800;color:#0d1f3c;${i % 2 ? "background:#fafcff;" : ""}">${b}</td></tr>`
      )
      .join("")}
  </table>`;
const bouton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#0d1f3c;color:#fff;text-decoration:none;${F}font-weight:700;font-size:14px;padding:13px 22px;border-radius:10px;margin:6px 8px 0 0;">${label}</a>`;
const rdv = (label = "Prendre rendez-vous") =>
  `<div style="margin:18px 0 6px;text-align:center;">
    <a href="${RELANCE_CALENDLY}" style="display:inline-block;background:#c9a84c;color:#0d1f3c;text-decoration:none;${F}font-weight:800;font-size:15.5px;padding:15px 28px;border-radius:10px;">📅 ${label}</a>
    <div style="${F}font-size:12px;color:#64748b;margin-top:8px;">Gratuit et sans engagement · en visio ou au cabinet (Issy-les-Moulineaux)</div>
  </div>`;
// Témoignages vidéo réels de clientes PER (YouTube), déjà utilisés sur le site et dans la séquence PER.
const TEMOIGNAGES = [
  { nom: "Dorothée", url: "https://youtube.com/shorts/_X1GVr28qRY", img: "https://gp-finances.fr/email/per-testimonials/dorothee-wide.jpg" },
  { nom: "Anaëlle", url: "https://youtube.com/shorts/gwC2ozYhkAw", img: "https://gp-finances.fr/email/per-testimonials/annaelle-wide.jpg" }
];
const temoignages = (campagne: CampagneRelance) =>
  `<div style="margin:18px 0 6px;padding:16px;background:#f5f8ff;border:1px solid #e1e9fb;border-radius:14px;">
    <div style="${F}font-weight:900;color:#0d1f3c;font-size:15px;margin:0 0 4px;">🎥 Ils ont fait le point sur leur PER avec nous</div>
    <div style="${F}font-size:13.5px;color:#334155;line-height:1.55;margin:0 0 12px;">${
      campagne === "avocats"
        ? "Avant de réserver, découvrez le témoignage de deux de nos clientes : elles racontent en vidéo comment s'est passé leur accompagnement sur le PER."
        : "Avant de réserver, découvrez le témoignage de Dorothée et Anaëlle : elles racontent en vidéo comment s'est passé leur accompagnement sur le PER."
    }</div>
    <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
      ${TEMOIGNAGES.map(
        (t, k) => `<td style="width:50%;vertical-align:top;padding:${k === 0 ? "0 6px 0 0" : "0 0 0 6px"};">
        <a href="${t.url}" style="display:block;text-decoration:none;">
          <img src="${t.img}" alt="Témoignage vidéo de ${t.nom}" width="270" style="width:100%;height:auto;border-radius:10px;display:block;border:1px solid #e1e9fb;">
          <div style="${F}font-size:13px;color:#0d1f3c;font-weight:800;margin-top:6px;text-align:center;">▶ Voir le témoignage de ${t.nom}</div>
        </a>
      </td>`
      ).join("")}
    </tr></table>
  </div>`;

/** Offre de fin d'année, insérée juste avant le bouton de rendez-vous de chaque e-mail. */
const offre = (campagne: CampagneRelance, numero: number) =>
  `<div style="margin:18px 0 4px;padding:16px 18px;background:#0d1f3c;border-radius:14px;">
    <div style="${F}font-weight:900;color:#c9a84c;font-size:15px;margin:0 0 8px;">🎁 ${numero >= 7 ? "Dernière ligne droite : offre valable jusqu'au 31 décembre" : "Offre de fin d'année, jusqu'au 31 décembre"}</div>
    <div style="${F}font-size:14px;color:#e5ecf6;line-height:1.6;">
      ✓ <strong style="color:#fff;">Votre étude PER personnalisée offerte</strong> : ${campagne === "avocats" ? "votre plafond d'indépendant calculé sur votre bénéfice, " : "votre plafond, "}l'impôt économisé selon le montant versé et une projection de votre épargne à la retraite, remise par écrit après le rendez-vous.<br>
      ✓ <strong style="color:#fff;">Frais sur versement réduits</strong> pour toute ouverture de PER à cette occasion.
    </div>
  </div>`;

const signature = () =>
  `<p style="margin:16px 0 0;">Bien à vous,</p>
   <p style="margin:6px 0 0;color:#0d1f3c;font-weight:700;">Gabriel Perbost</p>
   <p style="margin:2px 0 0;color:#64748b;font-size:13px;">Courtier indépendant · GP Finances</p>`;

// Avis Google réels (fiche GP FINANCES), jamais inventés.
const AVIS = [
  { auteur: "Johanna Djian", texte: "Un courtier qui a tout pour plaire : efficace, pédagogue, professionnel, réactif, et en plus sympathique !" },
  { auteur: "Edouard Ballout", texte: "Gabriel associe toutes les qualités recherchées : disponibilité, clarté et efficacité. Je ne peux que recommander !" },
  { auteur: "Didier Dorville", texte: "Excellente expérience avec Gabriel. À l'écoute de nos besoins et de notre situation, il a su nous accompagner avec efficacité…" },
  { auteur: "Julien Menier", texte: "Très réactif, et très pro, je recommande à 100%" }
];
const avis = (a: number, b: number) =>
  `<div style="margin:16px 0;padding:14px 16px;background:#fffaf0;border:1px solid #f3e2b8;border-radius:12px;">
    <div style="${F}font-weight:900;color:#0b1220;font-size:13px;margin-bottom:10px;">★★★★★ 5/5 · 22 avis Google</div>
    ${[a, b]
      .map(
        (i, k) =>
          `<div style="${F}font-size:13px;color:#334155;line-height:1.5;${k === 0 ? "margin:0 0 10px;padding-bottom:10px;border-bottom:1px solid #f3e2b8;" : ""}">« ${esc(AVIS[i].texte)} »<br><span style="color:#8a6d1d;font-weight:700;">— ${esc(AVIS[i].auteur)}</span></div>`
      )
      .join("")}
  </div>`;

const shell = (o: { campagne: CampagneRelance; titre: string; salutation: string; contenu: string; unsubscribeUrl: string; preheader: string }) => `
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(o.preheader)}</div>
<div style="background:#f5f8ff;padding:26px 14px;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:linear-gradient(180deg,#eef4ff 0%, #f5f8ff 100%);border-radius:18px;padding:14px;">
      <div style="background:#ffffff;border:1px solid #e7eefb;border-radius:16px;overflow:hidden;">
        <div style="padding:18px 18px 14px 18px;border-bottom:1px solid #edf2ff;">
          <div style="${F}color:#0b1220;font-weight:800;font-size:16px;">GP Finances</div>
          <div style="${F}color:#4b5563;font-size:13px;margin-top:4px;">Courtier indépendant · ${o.campagne === "avocats" ? "PER spécial avocats" : "Webinaire PER"}</div>
        </div>
        <div style="padding:18px;">
          <div style="${F}font-size:18px;font-weight:900;color:#0b1220;margin:0 0 10px;">${o.titre}</div>
          <div style="${F}font-size:14px;color:#334155;line-height:1.6;">
            <p style="margin:0 0 12px;">${o.salutation}</p>
            ${o.contenu}
            ${signature()}
          </div>
          <div style="margin-top:20px;border-top:1px solid #edf2ff;padding-top:14px;">
            <div style="${F}color:#64748b;font-size:11px;line-height:1.5;">
              GP Finances · Gabriel Perbost, courtier indépendant, ORIAS 23003789, adhérent ANACOFI-Courtage. Cet e-mail n'est ni un conseil personnalisé ni une offre de produit : l'avantage fiscal du PER dépend de votre situation personnelle et l'épargne est en principe disponible à la retraite.
              <br>Vous recevez cet e-mail à la suite de votre inscription à notre webinaire ${o.campagne === "avocats" ? "« PER et optimisation fiscale – Spécial avocats » du 17 septembre 2026" : "PER grand public (octobre ou novembre 2026)"}.
              <a href="${esc(o.unsubscribeUrl)}" style="color:#64748b;">Se désinscrire</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

/** Version texte (déduite du HTML) : liens rendus en « libellé : adresse ». */
const versionTexte = (html: string) =>
  html
    .replace(/<div style="display:none[^>]*>[\s\S]*?<\/div>/, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_m, href, label) => `${label.replace(/<[^>]+>/g, "").trim()} : ${href.replaceAll("&amp;", "&")}`)
    .replace(/<\/(p|div|tr|li)>|<br\s*\/?>/g, "\n")
    .replace(/<\/t[dh]>/g, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, a) => l || (a[i - 1] ?? "") !== "")
    .join("\n")
    .trim();

type Contenu = { subject: string; preheader: string; titre: string; contenu: string };

const PUBLIC: Record<number, Contenu> = {
  1: {
    subject: "Votre étude PER personnalisée offerte jusqu'au 31 décembre",
    preheader: "Le replay du webinaire, une étude offerte et des frais sur versement réduits pour l'occasion.",
    titre: "Et maintenant, votre situation à vous",
    contenu: [
      p("Vous vous étiez inscrit(e) à notre webinaire « PER : payer moins d'impôts et préparer sa retraite ». Si vous n'avez pas pu y assister, ou si vous souhaitez revoir un passage, le replay est toujours disponible :"),
      `<div style="margin:4px 0 14px;text-align:center;">${bouton(REPLAY_PUBLIC, "▶ Voir le replay du webinaire")}</div>`,
      "%%OFFRE%%",
      p("Un webinaire reste forcément général. La vraie question est : <strong>qu'est-ce que le PER donnerait dans votre situation ?</strong>"),
      encadreOr(
        "En 30 minutes de rendez-vous, nous regardons ensemble :",
        "• votre tranche d'imposition et l'économie d'impôt possible ;<br>• votre plafond de versement disponible (il est sur votre avis d'impôt) ;<br>• le montant de versement qui a du sens pour vous, ou s'il vaut mieux ne rien faire."
      ),
      p("Pour qu'un versement réduise votre impôt sur les revenus de 2026, il doit être fait <strong>avant le 31 décembre</strong>. C'est donc le bon moment pour en parler."),
      rdv(),
      avis(0, 1)
    ].join("")
  },
  2: {
    subject: "Combien le PER peut vous faire économiser cette année",
    preheader: "Le calcul tient en une ligne : versement × votre tranche d'imposition.",
    titre: "Le calcul tient en une ligne",
    contenu: [
      p("Les versements sur un PER sont déductibles de votre revenu imposable, dans la limite de votre plafond. L'économie d'impôt se calcule simplement :"),
      encadre(`<div style="text-align:center;font-size:16px;font-weight:800;color:#0d1f3c;">Versement × votre taux marginal d'imposition</div>`),
      p("Pour un versement de 4 000 € :"),
      tableau(
        [
          ["Tranche à 11 %", "440 €"],
          ["Tranche à 30 %", "1 200 €"],
          ["Tranche à 41 %", "1 640 €"],
          ["Tranche à 45 %", "1 800 €"]
        ],
        ["Votre tranche", "Impôt en moins"]
      ),
      p("Ces sommes ne sont pas « perdues » : elles restent placées sur votre PER pour votre retraite. En contrepartie, l'épargne est en principe bloquée jusqu'à la retraite, et les sommes sont imposées à la sortie. C'est pour cela que le bon montant dépend de votre situation."),
      p("Pour que cela compte sur vos revenus 2026, le versement doit être fait <strong>avant le 31 décembre</strong>. En rendez-vous, nous faisons le calcul exact avec votre avis d'impôt."),
      rdv("Faire mon calcul avec Gabriel")
    ].join("")
  },
  3: {
    subject: "Votre plafond PER est écrit sur votre avis d'impôt",
    preheader: "Où le trouver, et pourquoi vous avez souvent plus de marge que vous ne le pensez.",
    titre: "Où trouver votre plafond PER",
    contenu: [
      p("Avant tout versement, il faut connaître votre plafond de déduction. Bonne nouvelle : vous n'avez rien à calculer, il est indiqué sur votre <strong>avis d'impôt</strong>."),
      encadreOr(
        "📄 Comment le retrouver",
        "1. Ouvrez votre dernier avis d'impôt (espace particulier sur impots.gouv.fr).<br>2. Cherchez le cadre <strong>« Plafond épargne retraite »</strong>.<br>3. Le montant indiqué est ce que vous pouvez verser et déduire cette année."
      ),
      p("Pour un salarié, le plafond 2026 correspond à 10 % des revenus professionnels de 2025, avec un minimum de 4 710 € et un maximum de 37 680 €. Et il s'y ajoute les montants <strong>non utilisés des années précédentes</strong> : beaucoup de personnes ont donc plus de marge qu'elles ne le pensent."),
      p("Vous pouvez l'avoir sous les yeux pendant notre rendez-vous : nous verrons ensemble quel montant a vraiment du sens pour vous."),
      rdv(),
      avis(2, 3)
    ].join("")
  },
  4: {
    subject: "Les questions qui reviennent le plus sur le PER",
    preheader: "Blocage, sortie, intérêt réel : les réponses courtes.",
    titre: "Les 3 questions qu'on me pose le plus",
    contenu: [
      encadre(`<strong style="color:#0d1f3c;">1. L'argent est-il bloqué ?</strong><br>Oui, jusqu'à la retraite, avec des exceptions prévues par la loi : achat de votre résidence principale et accidents de la vie (invalidité, décès du conjoint, fin des droits au chômage, surendettement…).`),
      encadre(`<strong style="color:#0d1f3c;">2. Comment récupère-t-on l'argent ?</strong><br>À la retraite, vous choisissez : en capital (en une ou plusieurs fois), en rente, ou un mélange des deux. La fiscalité diffère selon le choix, et nous la regardons avant de décider.`),
      encadre(`<strong style="color:#0d1f3c;">3. Est-ce vraiment intéressant pour moi ?</strong><br>Cela dépend surtout de deux choses : votre tranche d'imposition aujourd'hui, et celle que vous aurez probablement à la retraite. Plus l'écart est grand, plus le PER est intéressant.`),
      p("C'est précisément cette troisième question que nous traitons en rendez-vous, chiffres à l'appui."),
      rdv("Poser mes questions à Gabriel")
    ].join("")
  },
  5: {
    subject: "PER ou assurance-vie : lequel choisir ?",
    preheader: "Ils ne répondent pas au même besoin, et la bonne réponse est souvent un dosage des deux.",
    titre: "PER ou assurance-vie ?",
    contenu: [
      p("C'est l'une des questions les plus fréquentes. En réalité, ils ne répondent pas au même besoin :"),
      tableau(
        [
          ["Réduire ses impôts dès cette année", "PER"],
          ["Épargne disponible à tout moment", "Assurance-vie"],
          ["Préparer la retraite", "Les deux"],
          ["Transmettre un capital à ses proches", "Assurance-vie (et PER)"]
        ],
        ["Votre objectif", "Le plus adapté"]
      ),
      p("Le PER fait baisser l'impôt aujourd'hui en contrepartie d'une épargne bloquée. L'assurance-vie offre de la souplesse et un cadre favorable à la transmission. Pour beaucoup de foyers, la bonne réponse est <strong>un dosage des deux</strong>, selon les projets et la tranche d'imposition."),
      p("En 30 minutes, nous pouvons voir la bonne répartition pour vous."),
      rdv(),
      avis(1, 2)
    ].join("")
  },
  6: {
    subject: "Un exemple concret de versement PER",
    preheader: "Claire, 42 ans, salariée : ce que change un versement avant le 31 décembre.",
    titre: "Un exemple concret",
    contenu: [
      p("Pour rendre les choses concrètes, prenons un exemple <em>(fictif, pour illustrer)</em> :"),
      encadreOr(
        "Claire, 42 ans, salariée",
        "55 000 € de revenus, célibataire, dans la tranche à 30 %. Son avis d'impôt indique un plafond épargne retraite de plus de 5 000 €."
      ),
      tableau([
        ["Versement sur son PER avant le 31 décembre", "3 000 €"],
        ["Impôt en moins (3 000 € × 30 %)", "900 €"],
        ["Effort réel d'épargne", "2 100 €"]
      ]),
      p("Les 3 000 € restent placés pour sa retraite. Chaque situation est différente : votre tranche, votre plafond et vos projets changent la donne. Voyons la vôtre."),
      rdv("Étudier ma situation")
    ].join("")
  },
  7: {
    subject: "Plus que deux semaines pour un versement PER déductible en 2026",
    preheader: "Le versement doit être encaissé avant le 31 décembre : mieux vaut s'y prendre cette semaine.",
    titre: "Plus que deux semaines",
    contenu: [
      p("Pour réduire votre impôt sur les revenus 2026, le versement sur votre PER doit être <strong>effectué avant le 31 décembre</strong>."),
      encadreOr(
        "⏳ Pourquoi s'y prendre maintenant",
        "Une ouverture de contrat demande quelques jours (pièces justificatives, signature, virement). Avec les fêtes, les délais s'allongent : il est préférable d'en parler cette semaine pour être serein."
      ),
      p("Il me reste des créneaux avant les fêtes, en visio ou au cabinet. En un rendez-vous, nous vérifions si un versement a du sens pour vous et pour quel montant, sans engagement."),
      rdv("Réserver avant les fêtes"),
      avis(3, 0)
    ].join("")
  },
  8: {
    subject: "Mon dernier message à ce sujet",
    preheader: "Mon agenda reste ouvert, avant la fin de l'année ou plus tard pour 2027.",
    titre: "Dernier message",
    contenu: [
      p("Je ne vous relancerai plus sur ce sujet après ce message."),
      p("Si vous souhaitez faire le point sur le PER <strong>avant la fin de l'année</strong>, ou plus tard pour préparer 2027 tranquillement, mon agenda reste ouvert :"),
      rdv(),
      p("Merci encore pour votre intérêt pour le webinaire, et très belles fêtes de fin d'année."),
      `<div style="margin:6px 0 0;text-align:center;">${bouton(REPLAY_PUBLIC, "▶ Revoir le replay")}</div>`
    ].join("")
  }
};

const AVOCATS: Record<number, Contenu> = {
  1: {
    subject: "Maître, votre étude PER personnalisée offerte avant le 31 décembre",
    preheader: "Suite au webinaire du 17 septembre : étude offerte et frais sur versement réduits pour l'occasion.",
    titre: "Votre PER avant la fin de l'année",
    contenu: [
      p("Vous vous étiez inscrit(e) à notre webinaire « PER et optimisation fiscale – Spécial avocats » du 17 septembre. Le replay reste disponible si vous souhaitez revoir un point :"),
      `<div style="margin:4px 0 14px;text-align:center;">${bouton(REPLAY_AVOCATS, "▶ Voir le replay du webinaire")}</div>`,
      "%%OFFRE%%",
      p("La fin d'année est le moment où la question se pose concrètement : <strong>un versement sur un PER avant le 31 décembre réduit l'impôt dû au titre de 2026</strong>, dans la limite de votre plafond."),
      encadreOr(
        "En 30 minutes, nous regardons ensemble :",
        "• votre plafond de déduction d'indépendant (souvent bien plus élevé que celui d'un salarié) ;<br>• l'économie d'impôt selon votre tranche ;<br>• le montant cohérent avec votre trésorerie et vos projets, ou s'il vaut mieux ne rien faire."
      ),
      rdv(),
      avis(1, 2)
    ].join("")
  },
  2: {
    subject: "Votre plafond PER d'avocat est plus élevé que vous ne le pensez",
    preheader: "En tant qu'indépendant, vous pouvez déduire jusqu'à 88 911 € pour 2026.",
    titre: "Le plafond des indépendants",
    contenu: [
      p("En exercice libéral, votre plafond de déduction PER ne suit pas la règle des salariés. Il se calcule sur votre <strong>bénéfice imposable</strong> :"),
      encadre(`<strong style="color:#0d1f3c;">10 %</strong> du bénéfice (retenu jusqu'à 8 fois le plafond de la Sécurité sociale)<br><strong style="color:#0d1f3c;">+ 15 %</strong> de la part du bénéfice comprise entre 1 et 8 fois ce plafond<br><span style="color:#64748b;font-size:13px;">Soit jusqu'à 88 911 € de versements déductibles pour 2026.</span>`),
      p("Un exemple pour un bénéfice de 120 000 € en 2026 :"),
      tableau(
        [
          ["10 % × 120 000 €", "12 000 €"],
          ["15 % × (120 000 € − 48 060 €)", "10 791 €"],
          ["Plafond de déduction", "22 791 €"]
        ],
        ["Calcul", "Montant"]
      ),
      p("Beaucoup d'avocats n'utilisent qu'une petite partie de cette capacité. Nous pouvons calculer la vôtre précisément, à partir de votre bénéfice."),
      rdv("Calculer mon plafond")
    ].join("")
  },
  3: {
    subject: "Combien un versement PER peut réduire votre impôt 2026",
    preheader: "Versement × tranche marginale : les ordres de grandeur pour 10 000 € versés.",
    titre: "Ce que représente un versement",
    contenu: [
      p("Le versement est déduit de votre revenu imposable. L'économie d'impôt correspond donc à votre <strong>tranche marginale d'imposition</strong>. Pour 10 000 € versés :"),
      tableau(
        [
          ["Tranche à 30 %", "3 000 €"],
          ["Tranche à 41 %", "4 100 €"],
          ["Tranche à 45 %", "4 500 €"]
        ],
        ["Votre tranche", "Impôt en moins"]
      ),
      p("Ces sommes restent placées pour votre retraite. En contrepartie, l'épargne est en principe bloquée jusqu'à la retraite et imposée à la sortie : l'intérêt dépend de l'écart entre votre tranche d'aujourd'hui et celle de demain."),
      p("Pour être pris en compte sur 2026, le versement doit être fait <strong>avant le 31 décembre</strong>."),
      rdv("Faire mon calcul avec Gabriel"),
      avis(0, 3)
    ].join("")
  },
  4: {
    subject: "Les questions que posent le plus les avocats sur le PER",
    preheader: "Revenus variables, blocage, sortie : les réponses courtes.",
    titre: "Vos questions, en bref",
    contenu: [
      encadre(`<strong style="color:#0d1f3c;">Mes revenus varient d'une année sur l'autre. Est-ce un problème ?</strong><br>Non : les versements sont libres. Vous choisissez chaque année le montant, et vous pouvez ne rien verser une année plus difficile.`),
      encadre(`<strong style="color:#0d1f3c;">L'argent est-il bloqué ?</strong><br>Oui, jusqu'à la retraite, avec des exceptions prévues par la loi : achat de la résidence principale et accidents de la vie, dont la cessation d'activité non salariée à la suite d'une liquidation judiciaire.`),
      encadre(`<strong style="color:#0d1f3c;">Comment récupère-t-on l'épargne ?</strong><br>En capital, en rente, ou un mélange des deux. La fiscalité diffère selon le choix, et nous l'anticipons dès le départ.`),
      p("Chaque cabinet et chaque situation sont différents : c'est l'objet du rendez-vous."),
      rdv("Poser mes questions à Gabriel")
    ].join("")
  },
  5: {
    subject: "PER, retraite CNBF, assurance-vie : comment tout s'articule",
    preheader: "Le PER complète vos régimes obligatoires, l'assurance-vie apporte la souplesse.",
    titre: "Comment tout s'articule",
    contenu: [
      p("Votre retraite d'avocat repose d'abord sur les régimes obligatoires de la <strong>CNBF</strong> (retraite de base et complémentaire). Pour maintenir votre niveau de vie, il est souvent utile de les compléter :"),
      tableau(
        [
          ["Réduire l'impôt dès cette année", "PER"],
          ["Garder une épargne disponible", "Assurance-vie"],
          ["Compléter la retraite CNBF", "Les deux"],
          ["Transmettre un capital", "Assurance-vie (et PER)"]
        ],
        ["Votre objectif", "Le plus adapté"]
      ),
      p("Pour la plupart des professions libérales, la bonne réponse est un <strong>dosage des deux</strong>, ajusté selon les années et la trésorerie du cabinet."),
      rdv(),
      avis(2, 1)
    ].join("")
  },
  6: {
    subject: "Un exemple chiffré pour un avocat libéral",
    preheader: "Maître L., 45 ans, 120 000 € de bénéfice : ce que change un versement avant le 31 décembre.",
    titre: "Un exemple chiffré",
    contenu: [
      p("Un exemple <em>(fictif et simplifié, pour illustrer)</em> :"),
      encadreOr("Maître L., 45 ans, avocat libéral", "Bénéfice imposable de 120 000 € en 2026, tranche marginale à 41 %. Plafond de déduction d'indépendant : environ 22 800 €."),
      tableau([
        ["Versement sur son PER avant le 31 décembre", "10 000 €"],
        ["Impôt en moins (10 000 € × 41 %)", "4 100 €"],
        ["Effort réel d'épargne", "5 900 €"]
      ]),
      p("Le résultat réel dépend de votre revenu imposable, de votre plafond disponible, de votre situation familiale et de votre horizon de retraite. Voyons le vôtre."),
      rdv("Étudier ma situation")
    ].join("")
  },
  7: {
    subject: "Plus que deux semaines pour un versement PER déductible en 2026",
    preheader: "Le versement doit être effectué avant le 31 décembre : mieux vaut s'en occuper cette semaine.",
    titre: "Plus que deux semaines",
    contenu: [
      p("Pour réduire votre impôt au titre de 2026, le versement sur votre PER doit être <strong>effectué avant le 31 décembre</strong>."),
      encadreOr(
        "⏳ Pourquoi s'y prendre maintenant",
        "Une ouverture de contrat demande quelques jours (pièces, signature électronique, virement). Avec la fin d'année et les fêtes, il est préférable d'en parler cette semaine."
      ),
      p("Il me reste des créneaux avant les fêtes, en visio ou au cabinet, y compris en fin de journée. Nous vérifions ensemble votre plafond et le montant pertinent, sans engagement."),
      rdv("Réserver avant les fêtes"),
      avis(3, 0)
    ].join("")
  },
  8: {
    subject: "Mon dernier message à ce sujet",
    preheader: "Mon agenda reste ouvert, avant la fin de l'année ou pour préparer 2027.",
    titre: "Dernier message",
    contenu: [
      p("Je ne vous relancerai plus sur ce sujet après ce message."),
      p("Si vous souhaitez faire le point sur votre PER <strong>avant le 31 décembre</strong>, ou plus tard pour organiser vos versements 2027, mon agenda reste ouvert :"),
      rdv(),
      p("Merci encore pour votre participation au webinaire, et très belles fêtes de fin d'année."),
      `<div style="margin:6px 0 0;text-align:center;">${bouton(REPLAY_AVOCATS, "▶ Revoir le replay")}</div>`
    ].join("")
  }
};

export const buildEmailRelance = (campagne: CampagneRelance, numero: number, contact: { prenom: string; unsubscribeUrl: string }): EmailRelance => {
  const c = (campagne === "avocats" ? AVOCATS : PUBLIC)[numero];
  if (!c) throw new Error(`relance_inconnue_${campagne}_${numero}`);
  const salutation = campagne === "avocats" ? "Bonjour Maître," : `Bonjour ${esc(contact.prenom.trim()) || ""},`.replace(" ,", ",");
  const marqueurRdv = `<div style="margin:18px 0 6px;text-align:center;">`;
  const i = c.contenu.indexOf(marqueurRdv);
  const contenu = c.contenu.includes("%%OFFRE%%")
    ? c.contenu.replace("%%OFFRE%%", offre(campagne, numero))
    : i >= 0
      ? c.contenu.slice(0, i) + offre(campagne, numero) + c.contenu.slice(i)
      : c.contenu + offre(campagne, numero);
  const html = shell({ campagne, titre: c.titre, salutation, contenu: contenu + temoignages(campagne), unsubscribeUrl: contact.unsubscribeUrl, preheader: c.preheader });
  return { subject: c.subject, preheader: c.preheader, html, text: versionTexte(html) };
};
