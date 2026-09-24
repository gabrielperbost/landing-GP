import type { PricingClient } from "./quote.cjs";

export function createAprilClient(options: {
  clientId: string;
  clientSecret: string;
  environment?: "integration" | "production";
  allowProduction?: boolean;
}): PricingClient;
