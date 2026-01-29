type Payload = Record<string, unknown>;

const fireGtag = (event: string, params?: Payload) => {
  if (typeof window === "undefined") return;
  // @ts-expect-error gtag may be injected by GA
  if (typeof window.gtag === "function") {
    // @ts-expect-error gtag signature
    window.gtag("event", event, params ?? {});
  }
};

const fireFbq = (event: string, params?: Payload) => {
  if (typeof window === "undefined") return;
  // @ts-expect-error fbq may be injected by Meta Pixel
  if (typeof window.fbq === "function") {
    // @ts-expect-error fbq signature
    window.fbq("trackCustom", event, params ?? {});
  }
};

export const track = (event: string, params?: Payload) => {
  fireGtag(event, params);
  fireFbq(event, params);
};

export const trackCTA = (label: string) => track("cta_click", { label });
export const trackLead = (status: "submitted" | "error") => track("lead_submit", { status });
export const trackRDV = (label: string) => track("rdv_click", { label });
export const trackVideoStart = (id: string) => track("video_start", { id });
export const trackVideoMid = (id: string) => track("video_50", { id });
export const trackVideoComplete = (id: string) => track("video_complete", { id });
