import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "../styles/globals.css";
import { CONFIG } from "@/content/site";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "GP Finances — Économisez sur votre assurance emprunteur",
  description:
    "GP Finances, courtier spécialisé Loi Lemoine, vous fait économiser jusqu’à 23 000 € sur votre assurance emprunteur sans changer de banque."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body>
        {CONFIG.GA4_ID !== "G-XXXXXXX" && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${CONFIG.GA4_ID}');
              `}
            </Script>
          </>
        )}
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
        {children}
      </body>
    </html>
  );
}
