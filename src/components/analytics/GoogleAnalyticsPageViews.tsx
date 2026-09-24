"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getCitySlugFromPath, getPageTypeFromPath } from "@/lib/pageContext";

type GoogleAnalyticsPageViewsProps = {
  measurementId: string;
};

type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
};

const GA4_PLACEHOLDER_ID = "G-XXXXXXX";

export function GoogleAnalyticsPageViews({ measurementId }: GoogleAnalyticsPageViewsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (measurementId === GA4_PLACEHOLDER_ID) return;
    if (typeof window === "undefined") return;
    const analyticsWindow = window as AnalyticsWindow;
    if (typeof analyticsWindow.gtag !== "function") return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    const citySlug = getCitySlugFromPath(pathname) || "none";
    const pageType = getPageTypeFromPath(pathname);

    analyticsWindow.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
      city_slug: citySlug,
      page_type: pageType
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
