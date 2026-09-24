/**
 * Small in-memory limiter per client key. It slows casual abuse of the pricing
 * route; on serverless hosting each instance has its own counter, so the
 * partner-side limits remain the real ceiling.
 */
const hits = new Map<string, number[]>();

export function allowRequest(key: string, limit = 6, windowMs = 10 * 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [name, times] of hits) if (!times.some((time) => now - time < windowMs)) hits.delete(name);
  }
  return true;
}
