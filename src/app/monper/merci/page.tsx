import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAM_NAMES = ["fbclid", "gclid", "msclkid", "campaign_id", "adset_id", "ad_id", "placement"];

const appendTrackingParams = (params: URLSearchParams, searchParams: SearchParams | undefined) => {
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

export default function MonPerThankYouPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = new URLSearchParams({ merci: "1" });
  appendTrackingParams(params, searchParams);

  redirect(`/per?${params.toString()}`);
}
