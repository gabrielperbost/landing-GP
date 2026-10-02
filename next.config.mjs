// [adresse publique, fichier dans public/site/pages/]
const SITE_PAGES = [
  ["/", "index"],
  ["/assurance-emprunteur", "assurance-emprunteur"],
  ["/per-retraite", "per"],
  ["/assurance-vie", "assurance-vie"],
  ["/prevoyance", "prevoyance"],
  ["/mutuelle", "mutuelle"],
  ["/regroupement-credits", "regroupement-credits"],
  ["/webinaire-per", "webinaire-per"],
  ["/webinaire-per/desinscription", "webinaire-per-desinscription"],
  ["/nous-trouver", "nous-trouver"],
  ["/mentions-legales", "mentions-legales"],
  ["/politique-de-confidentialite", "confidentialite"]
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: []
  },
  async headers() {
    return [
      // Les fichiers sources des pages restent accessibles mais ne doivent jamais être indexés (les vraies adresses sont les URL propres).
      { source: "/site/pages/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] },
      // Ressources du site : cache long (les fichiers changent de nom via ?v=).
      { source: "/site/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gp-finances.fr" }],
        destination: "https://gp-finances.fr/:path*",
        permanent: true
      },
      {
        // Ancienne page de test du simulateur : le simulateur du nouveau site remplace celle-ci.
        source: "/estimation-assurance-pret",
        destination: "/assurance-emprunteur#simuler-assurance",
        permanent: false
      },
      {
        source: "/tarificateur-gp/index.html",
        destination: "/tarificateur-gp",
        permanent: true
      },
      {
        source: "/monper/merci",
        destination: "/per?merci=1",
        permanent: false
      },
      // Pages locales assurance emprunteur : ancienne adresse -> nouvelle (301, SEO préservé).
      // Voir docs/campaigns (ou le rapport de migration) pour la liste complète ville par ville.
      {
        source: "/assurance-de-pret/hauts-de-seine",
        destination: "/assurance-emprunteur/hauts-de-seine",
        permanent: true
      },
      {
        source: "/assurance-de-pret/hauts-de-seine/:ville",
        destination: "/assurance-emprunteur/:ville",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/per",
          destination: "/landing-per-gp-finances.html"
        },
        // Site GP FINANCES (pages construites par `node scripts/build-site.cjs`, voir public/site/routes.json).
        // « /per » reste l'ancienne page de campagne PER : la nouvelle page PER est /per-retraite.
        ...SITE_PAGES.map(([source, page]) => ({ source, destination: `/site/pages/${page}.html` })),
        // Rubrique Conseils (pages présentes seulement pour les articles publiés)
        { source: "/conseils", destination: "/site/pages/conseils.html" },
        { source: "/conseils/:slug", destination: "/site/pages/conseils/:slug.html" },
        // Pages locales assurance emprunteur : même page « assurance emprunteur », contenu propre
        // à chaque ville. Le hub doit être déclaré AVANT la route dynamique :ville, sinon
        // "/assurance-emprunteur/hauts-de-seine" serait aussi capturé comme un slug de ville.
        { source: "/assurance-emprunteur/hauts-de-seine", destination: "/site/pages/villes/hauts-de-seine.html" },
        { source: "/assurance-emprunteur/paris", destination: "/site/pages/villes/paris.html" },
        { source: "/assurance-emprunteur/:ville", destination: "/site/pages/villes/:ville.html" }
      ]
    };
  }
};

export default nextConfig;
