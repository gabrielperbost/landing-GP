"use client";

import { useEffect } from "react";

type TallyMessage = {
  event?: string;
  type?: string;
  payload?: Record<string, unknown>;
};

type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
};

const getTallyEventName = (data: unknown) => {
  if (!data || typeof data !== "object") return "";
  const message = data as TallyMessage;
  return String(message.event || message.type || "");
};

const getTallyPayload = (data: unknown) => {
  if (!data || typeof data !== "object") return {};
  const message = data as TallyMessage;
  return message.payload && typeof message.payload === "object" ? message.payload : {};
};

export function TallyEventTracking() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://tally.so") return;

      const tallyEvent = getTallyEventName(event.data);
      if (tallyEvent !== "Tally.FormSubmitted") return;

      const payload = getTallyPayload(event.data);
      const responseId = typeof payload.responseId === "string" ? payload.responseId : undefined;
      const formId = typeof payload.formId === "string" ? payload.formId : undefined;
      const analyticsWindow = window as AnalyticsWindow;

      if (typeof analyticsWindow.gtag === "function") {
        analyticsWindow.gtag("event", "generate_lead", {
          form: "monper_tally",
          form_id: formId,
          response_id: responseId
        });
        analyticsWindow.gtag("event", "gp_per_tally_submit", {
          form: "monper_tally",
          form_id: formId,
          response_id: responseId
        });
      }

      if (typeof analyticsWindow.fbq === "function") {
        analyticsWindow.fbq("track", "Lead", {
          content_name: "monper_tally",
          form_id: formId
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
