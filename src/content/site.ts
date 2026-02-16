export const CONFIG = {
  HERO_VIDEO_URL: "https://d1yei2z3i6k35z.cloudfront.net/10942363/6787d9e7c2ca0_VSLGab-VEED.mp4",
  PROCESS_VIDEOS: [
    "https://cdn.example.com/videos/process-1.mp4",
    "https://cdn.example.com/videos/process-2.mp4",
    "https://cdn.example.com/videos/process-3.mp4",
    "https://cdn.example.com/videos/process-4.mp4"
  ],
  TESTIMONIAL_VIDEOS: [
    "/videos/temoignage1.mp4",
    "https://cdn.example.com/videos/testimonial-2.mp4",
    "/videos/temoignage3.mp4",
    "/videos/temoignage2.mp4"
  ],
  INSTAGRAM_REELS: [
    "/videos/video5.mp4",
    "/videos/video6.mp4",
    "/videos/video7.mp4",
    "/videos/video8.mp4"
  ],
  CALENDLY_URL: "https://calendly.com/gabriel-perbost-gp-finances/economies",
  LEAD_FORM_ENDPOINT: "https://api.example.com/leads",
  META_PIXEL_ID: "YOUR_META_PIXEL_ID",
  GA4_ID: "G-XXXXXXX"
};

export const HERO_COPY = {
  headlines: [
    "Économisez en moyenne 23 000 € en changeant votre assurance emprunteur grâce à la loi Lemoine"
  ],
  subtitle: "Sans changer de banque. Sans paperasse. Avec les mêmes garanties.",
  bullets: [
    "Je prends en charge 100% des démarches",
    "Économies immédiates",
    "Garanties équivalentes ou supérieures"
  ],
  microcopy: "Offert – Sans engagement – Données sécurisées – Gabriel Perbost"
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
  newLabel: "Nouvelle assurance proposée par notre cabinet",
  oldCost: "32 710 €",
  newCost: "11 510 €",
  savings: "21 200 €"
};

export const TIMELINE = [
  {
    title: "Analyse gratuite",
    desc: "J’analyse votre dossier et vos garanties en express.",
    video: CONFIG.PROCESS_VIDEOS[0]
  },
  {
    title: "Mise en concurrence",
    desc: "Je challenge 51 assureurs pour maximiser vos économies.",
    video: CONFIG.PROCESS_VIDEOS[1]
  },
  {
    title: "Démarches complètes",
    desc: "Je gère la banque et l’assureur, zéro paperasse pour vous.",
    video: CONFIG.PROCESS_VIDEOS[2]
  },
  {
    title: "Mise en place",
    desc: "3 à 4 semaines en moyenne, économies immédiates.",
    video: CONFIG.PROCESS_VIDEOS[3]
  }
];

export const NUMERIC_TESTIMONIALS = [
  { quote: "J’ai économisé 17 549 €", name: "Karim L." },
  { quote: "J’ai économisé 23 690 €", name: "Camille R." },
  { quote: "J’ai économisé 38 651 €", name: "Thomas D." },
  { quote: "J’ai économisé 12 500 €", name: "J. Nguyen" }
];

export const FAQ_ITEMS = [
  {
    q: "Combien puis-je économiser ?",
    a: "Selon le capital restant dû et la durée, l’économie observée va de quelques milliers d’euros à plus de 20 000 €."
  },
  {
    q: "Dois-je prévenir ma banque ?",
    a: "Je m’occupe de prévenir la banque et de tout le formalisme."
  },
  {
    q: "Est-ce risqué ?",
    a: "Non, la loi Lemoine protège votre droit au changement et impose l’équivalence de garanties."
  },
  {
    q: "Les garanties changent-elles ?",
    a: "Je ne propose que des contrats avec équivalence ou supériorité de garanties."
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
    a: "Je traite les prêts résidence principale, locatif et professionnels."
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

export const ROLE_POINTS = [
  "Je compare 50+ assureurs.",
  "Je gère tout le dossier et l’administratif.",
  "Je négocie avec votre banque pour vous."
];

export const ROLE_BENEFITS = [
  "Du temps gagné (je gère démarches et relances).",
  "De la tranquillité (tout est fait dans les délais).",
  "Des économies maximisées sur votre assurance emprunteur."
];
