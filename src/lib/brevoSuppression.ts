import { normalizeEnv } from "@/lib/monday";

export type BrevoSuppression = {
  checkedAt: string;
  emails: string[];
  domains: string[];
  transactionalBlocked: number;
  marketingBlacklisted: number;
};

let cache: { key: string; expires: number; value: BrevoSuppression } | undefined;

export async function getBrevoSuppression(): Promise<BrevoSuppression> {
  const key = normalizeEnv(process.env.BREVO_API_KEY);
  if (!key) throw new Error("brevo_suppression_key_missing");
  if (cache?.key === key && cache.expires > Date.now()) return cache.value;

  const read = async (path: string) => {
    const response = await fetch(`https://api.brevo.com/v3${path}`, {
      headers: { accept: "application/json", "api-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`brevo_suppression_read_failed:${response.status}`);
    return response.json();
  };
  const collect = async (path: string, limit: number, marketing: boolean) => {
    const emails = new Set<string>();
    for (let page = 0; page < 128; page++) {
      const data = await read(`${path}?limit=${limit}&offset=${page * limit}&sort=asc`);
      const rows = data.contacts ?? (data.count === 0 ? [] : undefined);
      if (!Array.isArray(rows)) throw new Error("brevo_suppression_invalid_contacts");
      for (const row of rows) {
        if (marketing && row.emailBlacklisted !== true) continue;
        const email = String(row.email ?? "").trim().toLowerCase();
        if (email) emails.add(email);
      }
      if (rows.length < limit) {
        if (typeof data.count === "number" && data.count > page * limit + rows.length) {
          throw new Error("brevo_suppression_incomplete_contacts");
        }
        return emails;
      }
    }
    throw new Error("brevo_suppression_pagination_limit");
  };

  const checks = await Promise.allSettled([
    collect("/smtp/blockedContacts", 100, false),
    collect("/contacts", 1000, true),
    read("/smtp/blockedDomains")
  ]);
  for (const check of checks) if (check.status === "rejected") throw check.reason;
  const transactional = (checks[0] as PromiseFulfilledResult<Set<string>>).value;
  const marketing = (checks[1] as PromiseFulfilledResult<Set<string>>).value;
  const domainData = (checks[2] as PromiseFulfilledResult<{ domains?: unknown }>).value;
  if (!Array.isArray(domainData.domains) || domainData.domains.some(domain => typeof domain !== "string")) {
    throw new Error("brevo_suppression_invalid_domains");
  }
  const value = {
    checkedAt: new Date().toISOString(),
    emails: [...new Set([...transactional, ...marketing])],
    domains: domainData.domains.map(domain => String(domain).trim().toLowerCase()),
    transactionalBlocked: transactional.size,
    marketingBlacklisted: marketing.size
  };
  cache = { key, expires: Date.now() + 30000, value };
  return value;
}

export function isBrevoSuppressed(email: string, suppression: BrevoSuppression) {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  return suppression.emails.includes(normalized) || suppression.domains.some(blocked =>
    domain === blocked || domain.endsWith(`.${blocked}`)
  );
}
