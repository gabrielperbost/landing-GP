// [adresse publique, fichier dans public/site/pages/]
const SITE_PAGES = [
  ["/", "index"],
  ["/assurance-emprunteur", "assurance-emprunteur"],
  ["/per-retraite", "per"],
  ["/assurance-vie", "assurance-vie"],
  ["/prevoyance", "prevoyance"],
  ["/mutuelle", "mutuelle"],
  ["/regroupement-credits", "regroupement-credits"],
  ["/mentions-legales", "mentions-legales"],
  ["/politique-de-confidentialite", "confidentialite"]
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: []
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
        source: "/tarificateur-gp/index.html",
        destination: "/tarificateur-gp",
        permanent: true
      },
      {
        source: "/monper/merci",
        destination: "/per?merci=1",
        permanent: false
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
        ...SITE_PAGES.map(([source, page]) => ({ source, destination: `/site/pages/${page}.html` }))
      ]
    };
  }
};

export default nextConfig;
