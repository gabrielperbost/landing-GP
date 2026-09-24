import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { TallyEventTracking } from "@/components/analytics/TallyEventTracking";

type SearchParams = Record<string, string | string[] | undefined>;

const MON_PER_TITLE = "Decouvrez en 5 questions combien le PER va vous faire economiser.";
const MON_PER_FORM_URL = "https://tally.so/r/Zj1LK0";
const MON_PER_THANK_YOU_URL = "https://gp-finances.fr/monper/merci";
const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAM_NAMES = ["fbclid", "gclid", "msclkid", "campaign_id", "adset_id", "ad_id", "placement"];

const appendSearchParams = (params: URLSearchParams, searchParams: SearchParams | undefined) => {
  if (!searchParams) return;

  Object.entries(searchParams).forEach(([key, value]) => {
    const shouldForward = TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix)) || TRACKING_PARAM_NAMES.includes(key);
    if (!shouldForward) return;

    if (typeof value === "string") {
      params.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    }
  });
};

const buildMonPerEmbedUrl = (searchParams: SearchParams | undefined) => {
  const redirectParams = new URLSearchParams();
  appendSearchParams(redirectParams, searchParams);
  const redirectQuery = redirectParams.toString();

  const formParams = new URLSearchParams({
    transparentBackground: "1",
    formEventsForwarding: "1",
    redirect: redirectQuery ? `${MON_PER_THANK_YOU_URL}?${redirectQuery}` : MON_PER_THANK_YOU_URL
  });
  appendSearchParams(formParams, searchParams);

  return `${MON_PER_FORM_URL}?${formParams.toString()}`;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: MON_PER_TITLE,
  description: MON_PER_TITLE,
  alternates: {
    canonical: "/monper"
  },
  openGraph: {
    title: MON_PER_TITLE,
    description: MON_PER_TITLE,
    url: "https://gp-finances.fr/monper",
    siteName: "GP Finances",
    locale: "fr_FR",
    type: "website"
  }
};

export default function MonPerPage({ searchParams }: { searchParams?: SearchParams }) {
  const embedUrl = buildMonPerEmbedUrl(searchParams);

  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <TallyEventTracking />
      <main style={{ margin: 0, height: "100dvh", overflow: "hidden", position: "relative" }}>
        <iframe
          data-tally-src={embedUrl}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title={MON_PER_TITLE}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, border: 0 }}
        />
      </main>
    </>
  );
}
