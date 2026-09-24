"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/tracking";
import { getCitySlugFromPath, getPageTypeFromPath } from "@/lib/pageContext";

const SECTION_IDS = [
  "accueil",
  "points-cles",
  "cadre-legal",
  "compteur-economies",
  "accompagnement",
  "avant-apres",
  "avis-video",
  "process-gp",
  "reels-clients",
  "faq",
  "estimation"
];

const TIME_MARKS_SECONDS = [15, 30, 60, 120];
const SCROLL_MARKS = [25, 50, 75, 90];

const safePath = (pathname: string, query: string) => (query ? `${pathname}?${query}` : pathname);

export function useLandingBehaviorTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.location.search.startsWith("?") ? window.location.search.slice(1) : window.location.search;
    const pagePath = safePath(pathname, query);
    const pageType = getPageTypeFromPath(pathname);
    const citySlug = getCitySlugFromPath(pathname) || "none";
    const startedAt = Date.now();
    let maxScrollDepth = 0;
    let timeSpentSent = false;
    let sectionViewCount = 0;
    const seenSections = new Set<string>();
    const seenScrollMarks = new Set<number>();

    track("gp_lp_visit", {
      page_type: pageType,
      page_path: pagePath,
      city_slug: citySlug
    });

    const timers = TIME_MARKS_SECONDS.map((seconds) =>
      window.setTimeout(() => {
        track("gp_lp_time_mark", {
          page_type: pageType,
          page_path: pagePath,
          city_slug: citySlug,
          seconds
        });
      }, seconds * 1000)
    );

    const computeScrollDepth = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollable = Math.max(pageHeight - viewportHeight, 1);
      const depth = Math.min(100, Math.max(0, Math.round(((scrollTop + viewportHeight) / pageHeight) * 100)));
      const depthOnScrollable = Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
      return Math.max(depth, depthOnScrollable);
    };

    const onScroll = () => {
      const depth = computeScrollDepth();
      maxScrollDepth = Math.max(maxScrollDepth, depth);

      for (const mark of SCROLL_MARKS) {
        if (depth >= mark && !seenScrollMarks.has(mark)) {
          seenScrollMarks.add(mark);
          track("gp_lp_scroll", {
            page_type: pageType,
            page_path: pagePath,
            city_slug: citySlug,
            depth_pct: mark
          });
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = (entry.target as HTMLElement).id;
          if (!sectionId || seenSections.has(sectionId)) continue;
          seenSections.add(sectionId);
          sectionViewCount += 1;
          track("gp_lp_section", {
            page_type: pageType,
            page_path: pagePath,
            city_slug: citySlug,
            section_id: sectionId
          });
        }
      },
      { threshold: 0.35 }
    );

    SECTION_IDS.forEach((sectionId) => {
      const node = document.getElementById(sectionId);
      if (node) observer.observe(node);
    });

    const sendTimeSpent = () => {
      if (timeSpentSent) return;
      timeSpentSent = true;
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      track("gp_lp_time_spent", {
        page_type: pageType,
        page_path: pagePath,
        city_slug: citySlug,
        seconds,
        max_depth: maxScrollDepth,
        section_cnt: sectionViewCount
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendTimeSpent();
      }
    };

    window.addEventListener("pagehide", sendTimeSpent);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", sendTimeSpent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      sendTimeSpent();
    };
  }, [pathname]);
}
