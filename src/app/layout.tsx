import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "../styles/globals.css";
import { CONFIG, FAQ_ITEMS } from "@/content/site";
import { GoogleAnalyticsPageViews } from "@/components/analytics/GoogleAnalyticsPageViews";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gp-finances.fr"),
  alternates: {
    canonical: "/"
  },
  title: "Assurance emprunteur : changez grâce à la loi Lemoine | RDV gratuit – GP Finances",
  description:
    "Changez d’assurance de prêt à tout moment (loi Lemoine). Diagnostic gratuit : estimation des économies, garanties équivalentes, démarches gérées par Gabriel Perbost, courtier indépendant.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-512x512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body>
        {/* GA4 : chargé uniquement après consentement (bandeau « Tout accepter »),
            via le même script que le reste du site (voir consent-tracking.js et /api/site-config). */}
        <Script src="/site/consent-tracking.js" strategy="afterInteractive" />
        <Suspense fallback={null}>
          <GoogleAnalyticsPageViews measurementId={CONFIG.GA4_ID} />
        </Suspense>
        {/* Meta Pixel : chargé immédiatement, sans attendre le consentement — requis par
            Meta pour valider/publier les campagnes (vérification du pixel sur le domaine). */}
        {CONFIG.META_PIXEL_ID !== "YOUR_META_PIXEL_ID" && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${CONFIG.META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a }
            }))
          })}
        </Script>
        {children}
      </body>
    </html>
  );
}
