import references from "./references.ts";

/**
 * Whitelists the public form payload. Offer settings (commission, product,
 * guarantees) are never read from the browser: they live in quote.cjs.
 * Anything unexpected returns null, which the route turns into "call us".
 */
const PROJECTS = new Set(["ResidencePrincipale", "ResidenceSecondaire", "InvestissementLocatif"]);
const CATEGORIES = new Set(references.professionalCategories.map((item) => item.code));
const PROFESSIONS = new Set(references.professions.map((item) => item.code));
const TITLES = new Set(["Monsieur", "Madame"]);
const RISKS = ["smoker", "abroadTravel", "aerialOrLandSport", "highMileage", "workAtHeight", "heavyLoadHandling"] as const;
const DAY = 86_400_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() && value.length <= max && !/[{}<>\r\n]/.test(value) ? value.trim() : null;

/** One borrower: closed-list codes, explicit risk answers, optional coverage share (default 100 %). */
function sanitizePerson(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title, 10);
  const birthDate = text(raw.birthDate, 10);
  const category = text(raw.professionalCategory, 80);
  const profession = text(raw.profession, 120);
  if (!title || !birthDate || !category || !profession) return null;
  if (!TITLES.has(title) || !CATEGORIES.has(category) || !PROFESSIONS.has(profession)) return null;
  const risks: Record<string, boolean> = {};
  for (const key of RISKS) {
    if (typeof raw[key] !== "boolean") return null;
    risks[key] = raw[key] as boolean;
  }
  // Other outstanding insured capital (Lemoine); explicit, never defaulted to 0.
  const other = raw.otherInsuredOutstanding;
  if (typeof other !== "number" || !Number.isFinite(other) || other < 0 || other > 100_000_000) return null;
  // Coverage share (quotité): 1 to 100 %, 100 % when the customer leaves it empty.
  const share = raw.coveragePercentage === undefined || raw.coveragePercentage === null ? 100 : raw.coveragePercentage;
  if (typeof share !== "number" || !Number.isFinite(share) || share < 1 || share > 100) return null;
  return { title, birthDate, professionalCategory: category, profession, remainingAccountLemoine: other, coveragePercentage: share, ...risks };
}

export function sanitizeQuoteInput(body: unknown, now = new Date()): Record<string, unknown> | null {
  if (!isRecord(body) || !isRecord(body.address) || !isRecord(body.loan)) return null;
  // Données de santé (tabagisme, activités à risque) : consentement explicite obligatoire.
  if (body.consent !== true) return null;
  const { address, loan } = body;

  const postCode = text(address.postCode, 5);
  const city = text(address.city, 80);
  const projectType = text(body.projectType, 60);
  const effectiveDate = text(body.effectiveDate, 10);
  if (!postCode || !city || !projectType || !effectiveDate) return null;
  if (!PROJECTS.has(projectType)) return null;

  // Effective date: today to one year ahead. Other dates need a human.
  const effective = Date.parse(`${effectiveDate}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(effective) || effective < today || effective > today + 365 * DAY) return null;

  const person = sanitizePerson(body.person);
  if (!person) return null;
  // Optional second borrower: same rules, own coverage share.
  let coBorrower: Record<string, unknown> | undefined;
  if (body.coBorrower !== undefined && body.coBorrower !== null) {
    const parsed = sanitizePerson(body.coBorrower);
    if (!parsed) return null;
    coBorrower = parsed;
  }
  return {
    address: { postCode, city },
    projectType,
    effectiveDate,
    person,
    ...(coBorrower ? { coBorrower } : {}),
    // borrowedAmount = REMAINING capital, loanDuration = REMAINING months.
    loan: {
      loanType: text(loan.loanType, 20),
      deferred: loan.deferred === true,
      borrowedAmount: loan.borrowedAmount,
      loanDuration: loan.loanDuration,
      interestRate: loan.interestRate,
    },
    loans: Array.isArray(body.loans) ? body.loans : undefined,
  };
}
