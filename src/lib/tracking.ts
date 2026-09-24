type Payload = Record<string, unknown>;
type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, params?: Payload) => void;
  fbq?: (command: string, eventName: string, params?: Payload) => void;
};

const fireGtag = (event: string, params?: Payload) => {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as AnalyticsWindow;
  if (typeof analyticsWindow.gtag === "function") {
    analyticsWindow.gtag("event", event, params ?? {});
  }
};

const fireFbq = (event: string, params?: Payload) => {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as AnalyticsWindow;
  if (typeof analyticsWindow.fbq === "function") {
    analyticsWindow.fbq("trackCustom", event, params ?? {});
  }
};

export const track = (event: string, params?: Payload) => {
  fireGtag(event, params);
  fireFbq(event, params);
};

export const trackCTA = (label: string) => {
  track("gp_cta_click", { label });
  track("cta_click", { label });
};

export const trackLead = (status: "submitted" | "error", params?: Payload) => {
  const payload = { status, ...(params ?? {}) };
  track("gp_lead_submit", payload);
  track("lead_submit", payload);
};

export const trackRDV = (label: string) => {
  track("gp_rdv_click", { label });
  track("rdv_click", { label });
};

export const trackVideoStart = (videoId: string) => {
  track("gp_video_start", { video_id: videoId });
  track("video_start", { id: videoId });
};

export const trackVideoMid = (videoId: string) => {
  track("gp_video_50", { video_id: videoId });
  track("video_50", { id: videoId });
};

export const trackVideoComplete = (videoId: string) => {
  track("gp_video_complete", { video_id: videoId });
  track("video_complete", { id: videoId });
};

export const trackVideoProgress = (videoId: string, progressPct: number, watchSec: number) =>
  track("gp_video_progress", { video_id: videoId, progress_pct: progressPct, watch_sec: watchSec });
export const trackVideoWatchMark = (videoId: string, watchSec: number) =>
  track("gp_video_watch", { video_id: videoId, watch_sec: watchSec });
