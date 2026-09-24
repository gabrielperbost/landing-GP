import { type GuaranteeCode } from "@/lib/proLoanSimulation";

export type ImportedSimulationScheduleRow = {
  year: number;
  outstandingCapital: number;
  annualTotal: number;
  annualOptions: number | null;
  monthlyAverage: number | null;
};

export type ImportedSimulationBorrower = {
  rank: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  age: number | null;
  profession: string;
  smoker: boolean | null;
  quota: number | null;
  guarantees: GuaranteeCode[];
};

export type ImportedSimulationLoan = {
  rank: number;
  label: string;
  originalAmount: number | null;
  outstandingCapital: number | null;
  remainingMonths: number | null;
  monthlyInstallment: number | null;
  interestRate: number | null;
  defermentMonths: number | null;
  insuranceTotal: number | null;
  insuranceMonthlyFromSchedule: number | null;
};

export type ImportedInsurerSimulation = {
  sourceFileName: string;
  insurerName: string;
  productName: string;
  quoteReference: string;
  quoteDate: string | null;
  clientCivility: string;
  clientFirstName: string;
  clientLastName: string;
  borrowers: ImportedSimulationBorrower[];
  loans: ImportedSimulationLoan[];
  globalSchedule: ImportedSimulationScheduleRow[];
  feesDetected: {
    dossier: number | null;
    rightsEntry: number | null;
    associationAnnual: number | null;
  };
  totals: {
    totalDurationCost: number | null;
    totalEightYearsCost: number | null;
    meanAnnualRate: number | null;
  };
  warnings: string[];
  rawTextPreview: string;
};

const MAX_PREVIEW_CHARS = 1_800;

const toNormalizedText = (value: string) =>
  value
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toFrNumber = (value: string | null | undefined) => {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, "").replace(/,/g, ".").trim();
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const toIsoFromFrDate = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const computeAgeFromIsoDate = (isoDate: string | null) => {
  if (!isoDate) return null;
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  const dayDelta = now.getDate() - birth.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  if (!Number.isFinite(age) || age < 0) return null;
  return age;
};

const splitClientName = (fullName: string) => {
  const tokens = fullName
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (tokens.length === 0) {
    return {
      firstName: "",
      lastName: ""
    };
  }

  if (tokens.length === 1) {
    return {
      firstName: tokens[0],
      lastName: ""
    };
  }

  const lastToken = tokens[tokens.length - 1] ?? "";
  if (/^[A-Z\-']+$/.test(lastToken)) {
    return {
      firstName: tokens.slice(0, -1).join(" "),
      lastName: lastToken
    };
  }

  return {
    firstName: tokens.slice(0, -1).join(" "),
    lastName: tokens.slice(-1).join(" ")
  };
};

const parseGuaranteeCodes = (text: string): GuaranteeCode[] => {
  const guarantees: GuaranteeCode[] = [];

  if (/\bDC\b|D[ée]c[èe]s/i.test(text)) guarantees.push("DC");
  if (/\bPTIA\b|Perte Totale et Irr[ée]versible d[' ]Autonomie/i.test(text)) guarantees.push("PTIA");
  if (/\bITT\b|Incapacit[ée] Temporaire Totale/i.test(text)) guarantees.push("ITT");
  if (/\bIPT\b|Invalidit[ée] Permanente Totale/i.test(text)) guarantees.push("IPT");
  if (/\bIPP\b|Invalidit[ée] Permanente Partielle/i.test(text)) guarantees.push("IPP");
  if (/dos\/?psy|Option Confort Dos et Psy/i.test(text)) guarantees.push("MNO");

  return guarantees;
};

const parseGlobalSchedule = (normalizedText: string): ImportedSimulationScheduleRow[] => {
  const anchorIndex = normalizedText.search(/[ÉE]CH[ÉE]ANCIER SYNTH[ÈE]SE DES COTISATIONS/i);
  const scheduleText = anchorIndex >= 0 ? normalizedText.slice(anchorIndex) : normalizedText;

  const rows: ImportedSimulationScheduleRow[] = [];

  const rowRegex =
    /Ann(?:ée|ee|e)\s*(\d+)\s+([\d\s]+,\d{2})\s*€\s+([\d\s]+,\d{2})\s*€\s+([\d\s]+,\d{2})\s*€\s+([\d\s]+,\d{2})\s*€\s+([\d\s]+,\d{2})\s*€\s+([\d\s]+,\d{2})\s*€/gi;

  for (const match of scheduleText.matchAll(rowRegex)) {
    const year = Number(match[1]);
    const outstandingCapital = toFrNumber(match[2]);
    const annualTotal = toFrNumber(match[5]);
    const annualOptions = toFrNumber(match[6]);
    const monthlyAverage = toFrNumber(match[7]);

    if (!Number.isFinite(year) || !annualTotal || !outstandingCapital) continue;

    rows.push({
      year,
      outstandingCapital,
      annualTotal,
      annualOptions,
      monthlyAverage
    });
  }

  if (rows.length > 0) {
    return rows.sort((left, right) => left.year - right.year);
  }

  const fallbackRegex =
    /Ann(?:ée|ee|e)\s*(\d+)\s+([\d\s]+,\d{2})\s*€(?:\s+[\d\s]+,\d{2}\s*€){2}\s+([\d\s]+,\d{2})\s*€(?:\s+[\d\s]+,\d{2}\s*€)?\s+([\d\s]+,\d{2})\s*€/gi;

  for (const match of scheduleText.matchAll(fallbackRegex)) {
    const year = Number(match[1]);
    const outstandingCapital = toFrNumber(match[2]);
    const annualTotal = toFrNumber(match[3]);
    const monthlyAverage = toFrNumber(match[4]);

    if (!Number.isFinite(year) || !annualTotal || !outstandingCapital) continue;

    rows.push({
      year,
      outstandingCapital,
      annualTotal,
      annualOptions: null,
      monthlyAverage
    });
  }

  return rows.sort((left, right) => left.year - right.year);
};

const parseLoans = (
  normalizedText: string,
  globalSchedule: ImportedSimulationScheduleRow[]
): ImportedSimulationLoan[] => {
  const financingStart = normalizedText.search(/CARACT[ÉE]RISTIQUE\(S\) DU \(DES\) FINANCEMENT\(S\)/i);
  const financingEnd = normalizedText.search(/GARANTIES SOUHAIT[ÉE]ES/i);

  const financingText =
    financingStart >= 0 && financingEnd > financingStart
      ? normalizedText.slice(financingStart, financingEnd)
      : normalizedText;

  const loanRegex =
    /Pr[êe]t\s*n[°o]\s*(\d+)\s+([\d\s]+,\d{2})\s*€\s+Pr[êe]t\s+[A-Za-zÀ-ÿ\s]+?\s+([\d\s]+,\d{2})\s*%\s+(\d{1,3})\s+(\d{1,3})[^\d]+([\d\s]+,\d{2})\s*€/gi;

  const loans: ImportedSimulationLoan[] = [];

  for (const match of financingText.matchAll(loanRegex)) {
    const rank = Number(match[1]);
    const originalAmount = toFrNumber(match[2]);
    const interestRate = toFrNumber(match[3]);
    const remainingMonths = Number(match[4]);
    const defermentMonths = Number(match[5]);
    const monthlyInstallment = toFrNumber(match[6]);

    if (!Number.isFinite(rank)) continue;

    const totalInsuranceRegex = new RegExp(
      `PR[ÊE]T\\s*${rank}[\\s\\S]{0,5200}?Total sur dur[ée]e du pr[êe]t([\\s\\S]{0,260})`,
      "i"
    );

    const totalInsuranceBlock = normalizedText.match(totalInsuranceRegex)?.[1] ?? "";
    const totalInsuranceCandidates = [...totalInsuranceBlock.matchAll(/([\\d\\s]+,\\d{2})\\s*€/g)]
      .map((value) => toFrNumber(value[1]))
      .filter((value): value is number => value !== null);
    const insuranceTotal =
      totalInsuranceCandidates.length > 0 ? Math.max(...totalInsuranceCandidates) : null;
    const insuranceMonthlyFromSchedule =
      insuranceTotal && Number.isFinite(remainingMonths) && remainingMonths > 0
        ? insuranceTotal / remainingMonths
        : globalSchedule[0]?.monthlyAverage ?? null;

    loans.push({
      rank,
      label: `Pret ${rank}`,
      originalAmount,
      outstandingCapital: globalSchedule[0]?.outstandingCapital ?? originalAmount,
      remainingMonths: Number.isFinite(remainingMonths) ? remainingMonths : null,
      monthlyInstallment,
      interestRate,
      defermentMonths: Number.isFinite(defermentMonths) ? defermentMonths : null,
      insuranceTotal,
      insuranceMonthlyFromSchedule
    });
  }

  if (loans.length > 0) {
    if (loans.length === 1 && loans[0]?.insuranceTotal === null && globalSchedule.length > 0) {
      const rebuiltTotal = globalSchedule.reduce((sum, row) => sum + row.annualTotal, 0);
      loans[0] = {
        ...loans[0],
        insuranceTotal: rebuiltTotal,
        insuranceMonthlyFromSchedule:
          loans[0].remainingMonths && loans[0].remainingMonths > 0
            ? rebuiltTotal / loans[0].remainingMonths
            : loans[0].insuranceMonthlyFromSchedule
      };
    }

    return loans.sort((left, right) => left.rank - right.rank);
  }

  const fallbackDurationMatch = normalizedText.match(/Dur[ée]e\s*\(en mois\)\s*(\d{1,3})/i);
  const fallbackAmountMatch = normalizedText.match(/Pr[êe]t\s*n[°o]\s*1\s+([\d\s]+,\d{2})\s*€/i);
  const fallbackMonthly = globalSchedule[0]?.monthlyAverage ?? null;

  return [
    {
      rank: 1,
      label: "Pret 1",
      originalAmount: toFrNumber(fallbackAmountMatch?.[1] ?? null),
      outstandingCapital: globalSchedule[0]?.outstandingCapital ?? toFrNumber(fallbackAmountMatch?.[1] ?? null),
      remainingMonths: fallbackDurationMatch?.[1] ? Number(fallbackDurationMatch[1]) : null,
      monthlyInstallment: null,
      interestRate: null,
      defermentMonths: null,
      insuranceTotal: null,
      insuranceMonthlyFromSchedule: fallbackMonthly
    }
  ];
};

const parseBorrowers = (
  normalizedText: string,
  clientFirstName: string,
  clientLastName: string,
  guarantees: GuaranteeCode[]
): ImportedSimulationBorrower[] => {
  const borrowers: ImportedSimulationBorrower[] = [];

  const borrowerRegex =
    /ASSURE\s*(\d)\s+Identit[ée]\s*:\s*(Monsieur|Madame|M\.|Mme)\s+([A-Za-zÀ-ÿ'\-\s]+?)\s+Nom de naissance\s*:?\s*([A-Za-zÀ-ÿ'\-\s]+?)\s+N[ée]\(e\)\s*le\s*:\s*(\d{2}\/\d{2}\/\d{4})([\s\S]*?)(?=ASSURE\s*\d\s+Identit[ée]\s*:|CARACT[ÉE]RISTIQUE|GARANTIES SOUHAIT[ÉE]ES|$)/gi;

  for (const match of normalizedText.matchAll(borrowerRegex)) {
    const rank = Number(match[1]);
    const civilite = match[2] ?? "";
    const fullName = `${match[3] ?? ""}`.trim();
    const birthDate = toIsoFromFrDate(match[5] ?? null);
    const tail = match[6] ?? "";

    const professionMatch = tail.match(
      /Profession exacte\s*:\s*([A-Za-zÀ-ÿ'\-\s]+?)(?=\s+D[ée]placements professionnels|\s+Travail manuel|\s+Fumeur\s*:|$)/i
    );
    const smokerMatch = tail.match(/Fumeur\s*:\s*(Oui|Non)/i);

    const split = splitClientName(fullName);

    borrowers.push({
      rank: Number.isFinite(rank) ? rank : borrowers.length + 1,
      firstName: split.firstName || clientFirstName,
      lastName: split.lastName || clientLastName,
      birthDate,
      age: computeAgeFromIsoDate(birthDate),
      profession: professionMatch?.[1]?.trim() || "",
      smoker:
        smokerMatch?.[1]?.toLowerCase() === "oui"
          ? true
          : smokerMatch?.[1]?.toLowerCase() === "non"
            ? false
            : null,
      quota: null,
      guarantees
    });
  }

  const quotas = [...normalizedText.matchAll(/Quotit[ée]\s*(\d{1,3})\s*%/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));

  if (borrowers.length > 0) {
    return borrowers
      .map((borrower, index) => ({
        ...borrower,
        quota: quotas[index] ?? quotas[0] ?? (borrowers.length === 1 ? 100 : 50)
      }))
      .sort((left, right) => left.rank - right.rank);
  }

  return [
    {
      rank: 1,
      firstName: clientFirstName,
      lastName: clientLastName,
      birthDate: null,
      age: null,
      profession: "",
      smoker: null,
      quota: quotas[0] ?? 100,
      guarantees
    }
  ];
};

export const parseInsurerSimulationText = ({
  sourceFileName,
  pages
}: {
  sourceFileName: string;
  pages: string[];
}): ImportedInsurerSimulation => {
  const rawCombined = pages.join("\n\n");
  const normalizedText = toNormalizedText(rawCombined);

  const quoteReference = normalizedText.match(/R[ée]f[ée]rence du devis\s*:\s*([A-Za-z0-9-]+)/i)?.[1] ?? "";
  const quoteDateFr = normalizedText.match(/\bLe\s+(\d{2}\/\d{2}\/\d{4})\b/i)?.[1] ?? null;
  const quoteDate = toIsoFromFrDate(quoteDateFr);

  const civilityMatch = normalizedText.match(/\b(Monsieur|Madame|M\.|Mme)\s+([A-Za-zÀ-ÿ'\-\s]+?)\s+Le\s+\d{2}\/\d{2}\/\d{4}/i);
  const clientCivility = civilityMatch?.[1] ?? "";
  const fullClientName = civilityMatch?.[2]?.trim() ?? "";
  const splitClient = splitClientName(fullClientName);

  const productMatch = normalizedText.match(
    /R[ée]f[ée]rence du devis\s*:\s*[A-Za-z0-9-]+\s+([A-Za-zÀ-ÿ\-\s]{5,80}?)\s+Nous avons le plaisir/i
  );

  const productName = productMatch?.[1]?.trim() ?? "";
  const insurerName = productName ? productName.split(" ")[0] ?? "" : "";

  const guarantees = parseGuaranteeCodes(normalizedText);
  const globalSchedule = parseGlobalSchedule(normalizedText);
  const loans = parseLoans(normalizedText, globalSchedule);
  const borrowers = parseBorrowers(normalizedText, splitClient.firstName, splitClient.lastName, guarantees);

  const dossierFees = toFrNumber(
    normalizedText.match(/frais de dossier[^\d]*([\d\s]+,\d{2})\s*€/i)?.[1] ?? null
  );
  const rightsEntryFees =
    toFrNumber(normalizedText.match(/droits d[' ]entr[ée]e[^\d]*([\d\s]+(?:,\d{2})?)\s*€/i)?.[1] ?? null) ??
    toFrNumber(normalizedText.match(/s['’]?[ée]l[èe]vent\s+à\s+([\d\s]+(?:,\d{2})?)/i)?.[1] ?? null);
  const annualAssociationFees = toFrNumber(
    normalizedText.match(/cotisation [^\.]*? montant de\s*([\d\s]+,\d{2})\s*€/i)?.[1] ?? null
  );

  const totalDurationCost = toFrNumber(
    normalizedText.match(/Total sur dur[ée]e du pr[êe]t\s+([\d\s]+,\d{2})\s*€/i)?.[1] ?? null
  );
  const totalEightYearsCost = toFrNumber(
    normalizedText.match(/Co[ûu]t total sur 8 ans\s+([\d\s]+,\d{2})\s*€/i)?.[1] ?? null
  );
  const meanAnnualRate = toFrNumber(
    normalizedText.match(/taux annuel\s*:\s*([\d\s]+,\d{4})\s*%/i)?.[1] ?? null
  );

  const warnings: string[] = [];
  if (!splitClient.firstName || !splitClient.lastName) {
    warnings.push("Nom/Prenom client non trouves clairement dans le PDF import.");
  }
  if (!quoteReference) {
    warnings.push("Reference devis introuvable.");
  }
  if (globalSchedule.length === 0) {
    warnings.push("Echeancier global non detecte: verification manuelle recommandee.");
  }
  if (loans.length === 0) {
    warnings.push("Aucune ligne de pret fiable detectee.");
  }

  return {
    sourceFileName,
    insurerName,
    productName,
    quoteReference,
    quoteDate,
    clientCivility,
    clientFirstName: splitClient.firstName,
    clientLastName: splitClient.lastName,
    borrowers,
    loans,
    globalSchedule,
    feesDetected: {
      dossier: dossierFees,
      rightsEntry: rightsEntryFees,
      associationAnnual: annualAssociationFees
    },
    totals: {
      totalDurationCost,
      totalEightYearsCost,
      meanAnnualRate
    },
    warnings,
    rawTextPreview: normalizedText.slice(0, MAX_PREVIEW_CHARS)
  };
};
