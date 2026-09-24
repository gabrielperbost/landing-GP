const INTERNAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export const isBlockedSimulationUrl = (rawUrl: string): boolean => {
  const url = rawUrl.trim();
  if (!url) return true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  if (!/^https?:$/.test(parsed.protocol)) return true;

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  const isGpFinancesHost = host === "gp-finances.fr" || host === "www.gp-finances.fr";
  const isInternalHost = INTERNAL_HOSTS.has(host);

  if ((isGpFinancesHost || isInternalHost) && path.includes("/espace-client")) {
    return true;
  }

  return false;
};

export const isLikelySimulationUrl = (rawUrl: string): boolean => {
  const url = rawUrl.trim();
  if (!url || isBlockedSimulationUrl(url)) return false;

  const lower = url.toLowerCase();
  if (/\.pdf(?:$|[?#])/i.test(url)) return true;
  if (lower.includes("protected_static") && lower.includes("/resources/")) return true;
  if (lower.includes("download")) return true;
  if (lower.includes("dl=1")) return true;

  return false;
};
