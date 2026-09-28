"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getCitySlugFromPath, getPageTypeFromPath } from "@/lib/pageContext";

type GoogleAnalyticsPageViewsProps = {
  measurementId: string;
};

type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
};

const GA4_PLACEHOLDER_ID = "G-XXXXXXX";

export function GoogleAnalyticsPageViews({ measurementId }: GoogleAnalyticsPageViewsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const analyticsWindow = window as AnalyticsWindow;

    // Navigation côté client (App Router) entre deux pages déjà consenties : on ne recharge pas
    // consent-tracking.js, donc on renvoie ici les « pages vues » GA4 et Meta pour chaque page,
    // exactement comme le ferait un rechargement complet.
    if (typeof analyticsWindow.fbq === "function") {
      analyticsWindow.fbq("track", "PageView");
    }

    if (measurementId === GA4_PLACEHOLDER_ID) return;
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
