export const CONFIG = {
  HERO_VIDEO_URL: "https://cdn.example.com/videos/hero.mp4",
  PROCESS_VIDEOS: [
    "https://cdn.example.com/videos/process-1.mp4",
    "https://cdn.example.com/videos/process-2.mp4",
    "https://cdn.example.com/videos/process-3.mp4",
    "https://cdn.example.com/videos/process-4.mp4"
  ],
  TESTIMONIAL_VIDEOS: [
    "https://cdn.example.com/videos/testimonial-1.mp4",
    "https://cdn.example.com/videos/testimonial-2.mp4",
    "https://cdn.example.com/videos/testimonial-3.mp4"
  ],
  INSTAGRAM_REELS: [
    "https://www.instagram.com/reel/example1",
    "https://www.instagram.com/reel/example2",
    "https://www.instagram.com/reel/example3",
    "https://www.instagram.com/reel/example4"
  ],
  CALENDLY_URL: "https://calendly.com/gp-finances/rdv",
  LEAD_FORM_ENDPOINT: "https://api.example.com/leads",
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",
  GA4_ID: "G-XXXXXXX"
};

export const HERO_COPY = {
  headlines: [
    "Vous êtes à un clic d’économiser jusqu’à 23 000 € sur votre assurance de prêt",
    "Changez d’assurance emprunteur, gardez vos garanties, gagnez jusqu’à 23 000 €",
    "Loi Lemoine : activez jusqu’à 23 000 € d’économies sans changer de banque"
  ],
  subtitle: "Sans changer de banque. Sans paperasse. Avec les mêmes garanties.",
  bullets: ["Aucune démarche", "Économies immédiates", "Mêmes garanties"],
  microcopy: "Offert – Sans engagement – Données sécurisées"
};

export const WHY_POINTS = [
  {
    title: "Loi Lemoine",
    desc: "Résiliation possible à tout moment, même la première année."
  },
  {
    title: "Équivalence de garanties",
    desc: "Votre banque doit accepter dès lors que les garanties sont équivalentes."
  },
  {
    title: "Marché ouvert",
    desc: "51 assureurs partenaires en concurrence pour baisser vos coûts."
  }
];

export const BEFORE_AFTER = {
  oldLabel: "Ancienne assurance banque",
  newLabel: "Nouvelle assurance GP Finances",
  oldCost: "72 300 €",
  newCost: "48 900 €",
  savings: "23 400 €"
};

export const TIMELINE = [
  {
    title: "Analyse gratuite",
    desc: "Étude express de votre dossier et de vos garanties.",
    video: CONFIG.PROCESS_VIDEOS[0]
  },
  {
    title: "Mise en concurrence",
    desc: "51 assureurs challengés pour maximiser vos économies.",
    video: CONFIG.PROCESS_VIDEOS[1]
  },
  {
    title: "Démarches complètes",
    desc: "On gère banque et assureur, zéro paperasse pour vous.",
    video: CONFIG.PROCESS_VIDEOS[2]
  },
  {
    title: "Mise en place",
    desc: "3 à 4 semaines en moyenne, économies immédiates.",
    video: CONFIG.PROCESS_VIDEOS[3]
  }
];

export const NUMERIC_TESTIMONIALS = [
  { quote: "J’ai économisé 14 000 €", name: "Sophie M." },
  { quote: "J’ai économisé 17 549 €", name: "Karim L." },
  { quote: "J’ai économisé 23 690 €", name: "Camille R." },
  { quote: "J’ai économisé 38 651 €", name: "Thomas D." }
];

export const FAQ_ITEMS = [
  {
    q: "Combien puis-je économiser ?",
    a: "Selon le capital restant dû et la durée, l’économie observée va de quelques milliers d’euros à plus de 20 000 €."
  },
  {
    q: "Dois-je prévenir ma banque ?",
    a: "Nous nous chargeons de toute la notification et du formalisme pour vous."
  },
  {
    q: "Est-ce risqué ?",
    a: "Non, la loi Lemoine protège votre droit au changement et impose l’équivalence de garanties."
  },
  {
    q: "Les garanties changent-elles ?",
    a: "Nous ne proposons que des contrats avec équivalence ou supériorité de garanties."
  },
  {
    q: "Combien de temps ?",
    a: "3 à 4 semaines en moyenne, parfois plus rapide selon votre banque."
  },
  {
    q: "Frais cachés ?",
    a: "Aucun. L’accompagnement est offert et sans engagement."
  },
  {
    q: "Prêt ancien ?",
    a: "Oui, le changement est possible quel que soit l’âge de votre prêt."
  },
  {
    q: "Locatif / Pro ?",
    a: "Nous traitons les prêts résidence principale, locatif et professionnels."
  }
];

export const LEGAL = {
  company: "GP FINANCES",
  rcs: "RCS Nanterre 899 363 907",
  orias: "ORIAS 23003789",
  hq: "Issy-les-Moulineaux",
  status: "Courtier en assurance et opérations de banque",
  links: [
    { label: "Mentions légales", href: "#mentions-legales" },
    { label: "Confidentialité", href: "#confidentialite" },
    { label: "RGPD", href: "#rgpd" }
  ]
};
