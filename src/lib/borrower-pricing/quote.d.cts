export interface QuoteSolution {
  rank: number;
  name: string;
  contributionBasis: "capital_restant_du" | "capital_initial";
  total: number;
  averageMonthly: number;
  firstYear: number | null;
  eightYears: number | null;
  taea: number | null;
  startDate: string;
  endDate: string;
  periods: { startDate: string; endDate: string; amount: number }[];
}

export type QuoteResult =
  | { status: "quote"; solutions: QuoteSolution[]; readonly internal: { name: string; productCode: string; contributionType: string; total: number }[] }
  | { status: "call"; reason: string; message: string };

export interface PricingClient {
  price(project: unknown): Promise<unknown>;
}

export function quote(input: unknown, client: PricingClient): Promise<QuoteResult>;
export const CALL_MESSAGE: string;
