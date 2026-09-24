export type GuaranteeCode = "DC" | "PTIA" | "ITT" | "IPT" | "IPP" | "MNO" | "INVALIDITE_PRO";

export type GuaranteeOption = {
  code: GuaranteeCode;
  label: string;
  description: string;
};

export const GUARANTEE_OPTIONS: GuaranteeOption[] = [
  { code: "DC", label: "DC", description: "Deces" },
  { code: "PTIA", label: "PTIA", description: "Perte totale et irreversible d'autonomie" },
  { code: "ITT", label: "ITT", description: "Incapacite temporaire de travail" },
  { code: "IPT", label: "IPT", description: "Invalidite permanente totale" },
  { code: "IPP", label: "IPP", description: "Invalidite permanente partielle" },
  { code: "MNO", label: "MNO", description: "Maladies non objectives" },
  { code: "INVALIDITE_PRO", label: "Invalidite Pro", description: "Invalidite professionnelle" }
];

export type Borrower = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  profession: string;
  smoker: boolean;
  quota: number;
  guarantees: GuaranteeCode[];
};

export type GuaranteeTier = "Essentiel" | "Confort" | "Premium";

export type LoanLine = {
  id: string;
  label: string;
  bank: string;
  originalAmount: number;
  remainingMonths: number;
  outstandingCapital: number;
  currentInsuranceMonthly: number;
  proposedInsuranceMonthly: number;
  guaranteeTier: GuaranteeTier;
};

export type SimulationFees = {
  applicationFees: number;
  advisoryFees: number;
  additionalFees: number;
};

export type ImportedGlobalScheduleRow = {
  year: number;
  outstandingCapital: number;
  annualTotal: number;
  annualOptions: number | null;
  monthlyAverage: number | null;
};

export type ImportedSimulationMeta = {
  sourceFileName: string;
  insurerName: string;
  productName: string;
  quoteReference: string;
  warnings: string[];
};

export type ProLoanSimulationForm = {
  clientFirstName: string;
  clientLastName: string;
  clientCompany: string;
  advisorName: string;
  currentBank: string;
  meetingDate: string;
  borrowers: Borrower[];
  loans: LoanLine[];
  fees: SimulationFees;
  notes: string;
  importedGlobalSchedule: ImportedGlobalScheduleRow[];
  importedSimulationMeta: ImportedSimulationMeta | null;
};

export type LoanSummary = LoanLine & {
  remainingYears: number;
  currentRemainingCost: number;
  proposedRemainingCost: number;
  monthlySavings: number;
  annualSavings: number;
  totalSavings: number;
};

export type GlobalScheduleRow = {
  year: number;
  outstandingCapital: number;
  annualCurrentInsurance: number;
  annualProposedInsurance: number;
  annualSavings: number;
  monthlyCurrentAverage: number;
  monthlyProposedAverage: number;
  source: "imported" | "estimated";
};

export type ProLoanSimulationSummary = {
  loans: LoanSummary[];
  currentMonthlyTotal: number;
  proposedMonthlyTotal: number;
  monthlySavings: number;
  annualSavings: number;
  currentRemainingCostTotal: number;
  proposedRemainingCostTotal: number;
  grossSavingsTotal: number;
  totalFees: number;
  netGain: number;
  breakEvenMonths: number | null;
  weightedRemainingMonths: number;
  weightedRemainingYears: number;
  quotaTotal: number;
  globalSchedule: GlobalScheduleRow[];
};

const toSafeNumber = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value;
};

const toPositive = (value: number) => Math.max(0, toSafeNumber(value));

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const getTodayIsoDate = () => {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

export const formatCurrencyEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

export const formatPercent = (value: number) => `${round2(value).toString().replace(".", ",")} %`;

export const createBorrower = (index: number): Borrower => ({
  id: `borrower-${index}`,
  firstName: index === 1 ? "Jean" : "",
  lastName: index === 1 ? "Dupont" : "",
  age: index === 1 ? 42 : 40,
  profession: index === 1 ? "Dirigeant" : "Associe",
  smoker: false,
  quota: index === 1 ? 100 : 0,
  guarantees: ["DC", "PTIA", "ITT", "IPT"]
});

export const createLoanLine = (index: number): LoanLine => ({
  id: `loan-${index}`,
  label: `Pret ${index}`,
  bank: "",
  originalAmount: index === 1 ? 300_000 : 150_000,
  remainingMonths: index === 1 ? 180 : 144,
  outstandingCapital: index === 1 ? 248_000 : 102_000,
  currentInsuranceMonthly: index === 1 ? 118 : 64,
  proposedInsuranceMonthly: index === 1 ? 73 : 41,
  guaranteeTier: "Premium"
});

export const getDefaultProLoanSimulationForm = (): ProLoanSimulationForm => ({
  clientFirstName: "",
  clientLastName: "",
  clientCompany: "",
  advisorName: "Cabinet GP Finances",
  currentBank: "",
  meetingDate: getTodayIsoDate(),
  borrowers: [createBorrower(1)],
  loans: [createLoanLine(1)],
  fees: {
    applicationFees: 490,
    advisoryFees: 1_190,
    additionalFees: 0
  },
  notes: "",
  importedGlobalSchedule: [],
  importedSimulationMeta: null
});

const computeLoanSummary = (loan: LoanLine): LoanSummary => {
  const remainingMonths = Math.round(toPositive(loan.remainingMonths));
  const currentInsuranceMonthly = toPositive(loan.currentInsuranceMonthly);
  const proposedInsuranceMonthly = toPositive(loan.proposedInsuranceMonthly);

  const currentRemainingCost = currentInsuranceMonthly * remainingMonths;
  const proposedRemainingCost = proposedInsuranceMonthly * remainingMonths;
  const monthlySavings = currentInsuranceMonthly - proposedInsuranceMonthly;

  return {
    ...loan,
    originalAmount: toPositive(loan.originalAmount),
    outstandingCapital: toPositive(loan.outstandingCapital),
    remainingMonths,
    currentInsuranceMonthly,
    proposedInsuranceMonthly,
    remainingYears: round2(remainingMonths / 12),
    currentRemainingCost: round2(currentRemainingCost),
    proposedRemainingCost: round2(proposedRemainingCost),
    monthlySavings: round2(monthlySavings),
    annualSavings: round2(monthlySavings * 12),
    totalSavings: round2(currentRemainingCost - proposedRemainingCost)
  };
};

type AnnualAccumulator = {
  year: number;
  monthsSpan: number;
  outstandingCapital: number;
  annualCurrentInsurance: number;
  annualProposedInsurance: number;
};

const buildAnnualAccumulatorFromLoans = (loans: LoanSummary[]): AnnualAccumulator[] => {
  const byYear = new Map<number, AnnualAccumulator>();

  for (const loan of loans) {
    if (loan.remainingMonths <= 0) continue;

    const totalMonths = loan.remainingMonths;
    const years = Math.ceil(totalMonths / 12);

    for (let year = 1; year <= years; year += 1) {
      const elapsedBefore = (year - 1) * 12;
      const remainingAtStart = Math.max(totalMonths - elapsedBefore, 0);
      const monthsThisYear = Math.min(12, remainingAtStart);
      if (monthsThisYear <= 0) continue;

      const existing = byYear.get(year) ?? {
        year,
        monthsSpan: 0,
        outstandingCapital: 0,
        annualCurrentInsurance: 0,
        annualProposedInsurance: 0
      };

      const outstandingAtStart =
        totalMonths > 0 ? (toPositive(loan.outstandingCapital) * remainingAtStart) / totalMonths : 0;

      existing.monthsSpan = Math.max(existing.monthsSpan, monthsThisYear);
      existing.outstandingCapital += outstandingAtStart;
      existing.annualCurrentInsurance += toPositive(loan.currentInsuranceMonthly) * monthsThisYear;
      existing.annualProposedInsurance += toPositive(loan.proposedInsuranceMonthly) * monthsThisYear;

      byYear.set(year, existing);
    }
  }

  return [...byYear.values()]
    .sort((left, right) => left.year - right.year)
    .map((row) => ({
      year: row.year,
      monthsSpan: row.monthsSpan,
      outstandingCapital: round2(row.outstandingCapital),
      annualCurrentInsurance: round2(row.annualCurrentInsurance),
      annualProposedInsurance: round2(row.annualProposedInsurance)
    }));
};

const buildGlobalSchedule = (form: ProLoanSimulationForm, loans: LoanSummary[]): GlobalScheduleRow[] => {
  const estimatedRows = buildAnnualAccumulatorFromLoans(loans);
  const estimatedByYear = new Map<number, AnnualAccumulator>(
    estimatedRows.map((row) => [row.year, row])
  );

  const importedRows = [...form.importedGlobalSchedule]
    .filter((row) => Number.isFinite(row.year) && row.year > 0)
    .sort((left, right) => left.year - right.year);

  if (importedRows.length === 0) {
    return estimatedRows.map((row) => {
      const monthsSpan = Math.max(1, row.monthsSpan);
      const annualSavings = row.annualCurrentInsurance - row.annualProposedInsurance;

      return {
        year: row.year,
        outstandingCapital: row.outstandingCapital,
        annualCurrentInsurance: round2(row.annualCurrentInsurance),
        annualProposedInsurance: round2(row.annualProposedInsurance),
        annualSavings: round2(annualSavings),
        monthlyCurrentAverage: round2(row.annualCurrentInsurance / monthsSpan),
        monthlyProposedAverage: round2(row.annualProposedInsurance / monthsSpan),
        source: "estimated"
      };
    });
  }

  const maxYear = Math.max(
    importedRows[importedRows.length - 1]?.year ?? 0,
    estimatedRows[estimatedRows.length - 1]?.year ?? 0
  );

  const importedByYear = new Map<number, ImportedGlobalScheduleRow>(
    importedRows.map((row) => [row.year, row])
  );

  const merged: GlobalScheduleRow[] = [];

  for (let year = 1; year <= maxYear; year += 1) {
    const imported = importedByYear.get(year);
    const estimated = estimatedByYear.get(year);

    if (!imported && !estimated) continue;

    const annualCurrentInsurance = imported?.annualTotal ?? estimated?.annualCurrentInsurance ?? 0;
    const annualProposedInsurance = estimated?.annualProposedInsurance ?? 0;

    const inferredMonthsFromImport =
      imported?.monthlyAverage && imported.monthlyAverage > 0
        ? Math.max(1, Math.min(12, Math.round(annualCurrentInsurance / imported.monthlyAverage)))
        : null;

    const monthsSpan =
      estimated?.monthsSpan ?? inferredMonthsFromImport ?? (year === maxYear ? 12 : 12);

    merged.push({
      year,
      outstandingCapital: round2(imported?.outstandingCapital ?? estimated?.outstandingCapital ?? 0),
      annualCurrentInsurance: round2(annualCurrentInsurance),
      annualProposedInsurance: round2(annualProposedInsurance),
      annualSavings: round2(annualCurrentInsurance - annualProposedInsurance),
      monthlyCurrentAverage: round2(
        imported?.monthlyAverage ?? (monthsSpan > 0 ? annualCurrentInsurance / monthsSpan : 0)
      ),
      monthlyProposedAverage: round2(monthsSpan > 0 ? annualProposedInsurance / monthsSpan : 0),
      source: imported ? "imported" : "estimated"
    });
  }

  return merged;
};

export const computeProLoanSimulationSummary = (
  form: ProLoanSimulationForm
): ProLoanSimulationSummary => {
  const loans = form.loans.map(computeLoanSummary);

  const currentMonthlyTotal = round2(
    loans.reduce((sum, loan) => sum + loan.currentInsuranceMonthly, 0)
  );
  const proposedMonthlyTotal = round2(
    loans.reduce((sum, loan) => sum + loan.proposedInsuranceMonthly, 0)
  );
  const monthlySavings = round2(currentMonthlyTotal - proposedMonthlyTotal);
  const annualSavings = round2(monthlySavings * 12);

  const currentRemainingCostTotal = round2(
    loans.reduce((sum, loan) => sum + loan.currentRemainingCost, 0)
  );
  const proposedRemainingCostTotal = round2(
    loans.reduce((sum, loan) => sum + loan.proposedRemainingCost, 0)
  );
  const grossSavingsTotal = round2(currentRemainingCostTotal - proposedRemainingCostTotal);

  const totalFees = round2(
    toPositive(form.fees.applicationFees) + toPositive(form.fees.advisoryFees) + toPositive(form.fees.additionalFees)
  );
  const netGain = round2(grossSavingsTotal - totalFees);

  const totalOutstandingCapital = loans.reduce((sum, loan) => sum + toPositive(loan.outstandingCapital), 0);
  const weightedRemainingMonths = round2(
    totalOutstandingCapital > 0
      ? loans.reduce((sum, loan) => sum + loan.remainingMonths * toPositive(loan.outstandingCapital), 0) / totalOutstandingCapital
      : loans.length > 0
        ? loans.reduce((sum, loan) => sum + loan.remainingMonths, 0) / loans.length
        : 0
  );

  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(totalFees / monthlySavings) : null;
  const quotaTotal = round2(form.borrowers.reduce((sum, borrower) => sum + toPositive(borrower.quota), 0));

  return {
    loans,
    currentMonthlyTotal,
    proposedMonthlyTotal,
    monthlySavings,
    annualSavings,
    currentRemainingCostTotal,
    proposedRemainingCostTotal,
    grossSavingsTotal,
    totalFees,
    netGain,
    breakEvenMonths,
    weightedRemainingMonths,
    weightedRemainingYears: round2(weightedRemainingMonths / 12),
    quotaTotal,
    globalSchedule: buildGlobalSchedule(form, loans)
  };
};
