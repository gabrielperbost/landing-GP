"use client";

import clsx from "clsx";
import { type ChangeEvent, useMemo, useState } from "react";
import styles from "@/components/simulateur/ProLoanInsuranceSimulator.module.css";
import { type ImportedInsurerSimulation } from "@/lib/insurerSimulationImport";
import {
  GUARANTEE_OPTIONS,
  computeProLoanSimulationSummary,
  createBorrower,
  createLoanLine,
  formatCurrencyEuro,
  getDefaultProLoanSimulationForm,
  type Borrower,
  type GuaranteeCode,
  type LoanLine,
  type ProLoanSimulationForm
} from "@/lib/proLoanSimulation";

const parseNumericInput = (value: string) => {
  if (!value.trim()) return 0;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeFilePart = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.toLowerCase();
};

const QUOTA_HELPER_TEXT = "La quotite totale recommandee est generalement de 100% a 200% selon le montage.";

export const ProLoanInsuranceSimulator = () => {
  const [form, setForm] = useState<ProLoanSimulationForm>(() => getDefaultProLoanSimulationForm());
  const [isImportingSimulation, setIsImportingSimulation] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const summary = useMemo(() => computeProLoanSimulationSummary(form), [form]);

  const maximumMonthlyValue = Math.max(summary.currentMonthlyTotal, summary.proposedMonthlyTotal, 1);
  const currentBarHeight = Math.max((summary.currentMonthlyTotal / maximumMonthlyValue) * 170, 12);
  const proposedBarHeight = Math.max((summary.proposedMonthlyTotal / maximumMonthlyValue) * 170, 12);

  const savingsToneClass = summary.grossSavingsTotal >= 0 ? styles.valuePositive : styles.valueNegative;
  const netGainToneClass = summary.netGain >= 0 ? styles.valuePositive : styles.valueNegative;

  const canGeneratePdf =
    form.clientFirstName.trim().length > 0 &&
    form.clientLastName.trim().length > 0 &&
    form.loans.length > 0 &&
    !isGeneratingPdf;

  const updateRoot = <K extends keyof ProLoanSimulationForm>(field: K, value: ProLoanSimulationForm[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateFees = (field: keyof ProLoanSimulationForm["fees"], value: number) => {
    setForm((previous) => ({
      ...previous,
      fees: {
        ...previous.fees,
        [field]: value
      }
    }));
  };

  const updateBorrower = <K extends keyof Borrower>(borrowerId: string, field: K, value: Borrower[K]) => {
    setForm((previous) => ({
      ...previous,
      borrowers: previous.borrowers.map((borrower) =>
        borrower.id === borrowerId
          ? {
              ...borrower,
              [field]: value
            }
          : borrower
      )
    }));
  };

  const updateBorrowerGuarantees = (borrowerId: string, guarantee: GuaranteeCode) => {
    setForm((previous) => ({
      ...previous,
      borrowers: previous.borrowers.map((borrower) => {
        if (borrower.id !== borrowerId) return borrower;

        const hasGuarantee = borrower.guarantees.includes(guarantee);
        return {
          ...borrower,
          guarantees: hasGuarantee
            ? borrower.guarantees.filter((item) => item !== guarantee)
            : [...borrower.guarantees, guarantee]
        };
      })
    }));
  };

  const setBorrowerCount = (count: 1 | 2) => {
    setForm((previous) => {
      if (count === 1) {
        const firstBorrower = previous.borrowers[0] ?? createBorrower(1);
        return {
          ...previous,
          borrowers: [{ ...firstBorrower, quota: Math.min(firstBorrower.quota, 100) }]
        };
      }

      if (previous.borrowers.length >= 2) return previous;

      return {
        ...previous,
        borrowers: [...previous.borrowers, createBorrower(2)]
      };
    });
  };

  const updateLoan = <K extends keyof LoanLine>(loanId: string, field: K, value: LoanLine[K]) => {
    setForm((previous) => ({
      ...previous,
      loans: previous.loans.map((loan) =>
        loan.id === loanId
          ? {
              ...loan,
              [field]: value
            }
          : loan
      )
    }));
  };

  const addLoan = () => {
    setForm((previous) => ({
      ...previous,
      loans: [...previous.loans, createLoanLine(previous.loans.length + 1)]
    }));
  };

  const removeLoan = (loanId: string) => {
    setForm((previous) => {
      if (previous.loans.length <= 1) return previous;
      return {
        ...previous,
        loans: previous.loans.filter((loan) => loan.id !== loanId)
      };
    });
  };

  const applyImportedSimulation = (payload: ImportedInsurerSimulation) => {
    setForm((previous) => {
      const importedBorrowers = payload.borrowers.slice(0, 2).map((borrower, index) => {
        const base = createBorrower(index + 1);
        return {
          ...base,
          id: `borrower-${index + 1}`,
          firstName: borrower.firstName || base.firstName,
          lastName: borrower.lastName || base.lastName,
          age: borrower.age ?? base.age,
          profession: borrower.profession || base.profession,
          smoker: borrower.smoker ?? base.smoker,
          quota: borrower.quota ?? (payload.borrowers.length === 1 ? 100 : 50),
          guarantees: borrower.guarantees.length > 0 ? borrower.guarantees : base.guarantees
        };
      });

      const fallbackMonthlyFromSchedule = payload.globalSchedule[0]?.monthlyAverage ?? null;
      const importedLoans = (payload.loans.length > 0 ? payload.loans : []).map((loan, index) => {
        const base = createLoanLine(index + 1);
        const previousLoan = previous.loans[index];
        const importedMonthly =
          loan.insuranceMonthlyFromSchedule ?? fallbackMonthlyFromSchedule ?? previousLoan?.currentInsuranceMonthly ?? 0;

        const safeMonthly = Number.isFinite(importedMonthly) && importedMonthly > 0 ? importedMonthly : 0;

        return {
          ...base,
          id: previousLoan?.id ?? base.id,
          label: loan.label || previousLoan?.label || base.label,
          bank: previousLoan?.bank || "",
          originalAmount: loan.originalAmount ?? previousLoan?.originalAmount ?? base.originalAmount,
          outstandingCapital:
            loan.outstandingCapital ??
            loan.originalAmount ??
            previousLoan?.outstandingCapital ??
            base.outstandingCapital,
          remainingMonths: loan.remainingMonths ?? previousLoan?.remainingMonths ?? base.remainingMonths,
          currentInsuranceMonthly: safeMonthly || previousLoan?.currentInsuranceMonthly || base.currentInsuranceMonthly,
          proposedInsuranceMonthly: safeMonthly || previousLoan?.proposedInsuranceMonthly || base.proposedInsuranceMonthly,
          guaranteeTier: previousLoan?.guaranteeTier ?? base.guaranteeTier
        };
      });

      const nextBorrowers = importedBorrowers.length > 0 ? importedBorrowers : previous.borrowers;
      const nextLoans = importedLoans.length > 0 ? importedLoans : previous.loans;

      return {
        ...previous,
        clientFirstName: payload.clientFirstName || previous.clientFirstName,
        clientLastName: payload.clientLastName || previous.clientLastName,
        meetingDate: payload.quoteDate || previous.meetingDate,
        currentBank: previous.currentBank,
        borrowers: nextBorrowers,
        loans: nextLoans,
        fees: {
          ...previous.fees,
          applicationFees: payload.feesDetected.dossier ?? previous.fees.applicationFees
        },
        importedGlobalSchedule: payload.globalSchedule,
        importedSimulationMeta: {
          sourceFileName: payload.sourceFileName,
          insurerName: payload.insurerName,
          productName: payload.productName,
          quoteReference: payload.quoteReference,
          warnings: payload.warnings
        }
      };
    });
  };

  const handleImportSimulationFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingSimulation(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const body = new FormData();
      body.set("file", file);

      const response = await fetch("/api/simulation-import", {
        method: "POST",
        body
      });

      const payload = (await response.json()) as {
        data?: ImportedInsurerSimulation;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        if (payload.error === "unauthorized") {
          throw new Error("unauthorized");
        }
        throw new Error(payload.error || "import_failed");
      }

      applyImportedSimulation(payload.data);

      const referencePart = payload.data.quoteReference ? `Ref ${payload.data.quoteReference}` : "Reference non detectee";
      const insurerPart = payload.data.insurerName || "Assureur";
      setImportSuccess(`Simulation importee: ${insurerPart} - ${referencePart}.`);
    } catch (error) {
      console.error("simulation_pdf_import_failed", error);
      if (error instanceof Error && error.message === "unauthorized") {
        setImportError("Session interne expiree. Reconnecte-toi puis recommence.");
      } else {
        setImportError("Import impossible. Verifie le PDF puis recommence.");
      }
    } finally {
      setIsImportingSimulation(false);
      event.target.value = "";
    }
  };

  const handleGeneratePdf = async () => {
    if (!canGeneratePdf) return;

    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      const { generateProLoanSimulationPdf } = await import("@/lib/proLoanSimulationPdf");
      const pdfBytes = await generateProLoanSimulationPdf(form);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const safeClient = sanitizeFilePart(`${form.clientFirstName}-${form.clientLastName}`) || "client";
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `simulation-assurance-premium-${safeClient}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 800);
    } catch (error) {
      console.error("pdf_generation_failed", error);
      setPdfError("Generation PDF impossible pour le moment. Verifiez les champs puis recommencez.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch("/api/simulateur-auth/logout", {
        method: "POST"
      });
    } catch (error) {
      console.error("simulateur_logout_failed", error);
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.orbTop} aria-hidden="true" />
      <div className={styles.orbBottom} aria-hidden="true" />

      <section className={styles.heroCard}>
        <div>
          <p className={styles.heroEyebrow}>Outil interne GP Finances</p>
          <h1 className={styles.heroTitle}>Simulateur Assurance de Pret Professionnel et Premium</h1>
          <p className={styles.heroDescription}>
            Tu conserves ton simulateur assureur, puis tu renseignes ici les donnees pour sortir une simulation
            commerciale GP Finances, personnalisee et exportable en PDF 3 pages.
          </p>
        </div>

        <div className={styles.heroMetrics}>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Fermeture..." : "Se deconnecter"}
          </button>
          <div className={styles.heroMetricCard}>
            <span className={styles.metricLabel}>Economies brutes</span>
            <strong className={savingsToneClass}>{formatCurrencyEuro(summary.grossSavingsTotal)}</strong>
          </div>
          <div className={styles.heroMetricCard}>
            <span className={styles.metricLabel}>Gain net client</span>
            <strong className={netGainToneClass}>{formatCurrencyEuro(summary.netGain)}</strong>
          </div>
        </div>
      </section>

      <div className={styles.workspace}>
        <div className={styles.formColumn}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>Import PDF assureur</h2>
              <p>Importe le PDF assureur pour pre-remplir les champs, puis ajuste manuellement avant l&apos;export GP.</p>
            </div>

            <div className={styles.importBox}>
              <label className={styles.fileInputLabel} htmlFor="insurer-simulation-upload">
                Selectionner une simulation assureur (PDF)
              </label>
              <input
                id="insurer-simulation-upload"
                className={styles.fileInput}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleImportSimulationFile}
                disabled={isImportingSimulation}
              />

              {isImportingSimulation ? <p className={styles.helperText}>Import et lecture du PDF en cours...</p> : null}
              {importError ? <p className={styles.errorText}>{importError}</p> : null}
              {importSuccess ? <p className={styles.successText}>{importSuccess}</p> : null}
            </div>

            {form.importedSimulationMeta ? (
              <div className={styles.importMetaCard}>
                <p>
                  <strong>Fichier:</strong> {form.importedSimulationMeta.sourceFileName}
                </p>
                <p>
                  <strong>Produit:</strong>{" "}
                  {form.importedSimulationMeta.productName || form.importedSimulationMeta.insurerName || "-"}
                </p>
                <p>
                  <strong>Reference:</strong> {form.importedSimulationMeta.quoteReference || "-"}
                </p>
                {form.importedSimulationMeta.warnings.length > 0 ? (
                  <p className={styles.warningText}>
                    {form.importedSimulationMeta.warnings.join(" | ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>1. Informations client</h2>
              <p>Dossier de base, banque actuelle et contexte du rendez-vous.</p>
            </div>

            <div className={styles.fieldGridThree}>
              <label className={styles.field}>
                <span>Nom</span>
                <input
                  type="text"
                  value={form.clientLastName}
                  onChange={(event) => updateRoot("clientLastName", event.target.value)}
                  placeholder="MARTIN"
                />
              </label>

              <label className={styles.field}>
                <span>Prenom</span>
                <input
                  type="text"
                  value={form.clientFirstName}
                  onChange={(event) => updateRoot("clientFirstName", event.target.value)}
                  placeholder="Alexandre"
                />
              </label>

              <label className={styles.field}>
                <span>Societe</span>
                <input
                  type="text"
                  value={form.clientCompany}
                  onChange={(event) => updateRoot("clientCompany", event.target.value)}
                  placeholder="Holding Martin"
                />
              </label>

              <label className={styles.field}>
                <span>Banque actuelle</span>
                <input
                  type="text"
                  value={form.currentBank}
                  onChange={(event) => updateRoot("currentBank", event.target.value)}
                  placeholder="Banque Populaire"
                />
              </label>

              <label className={styles.field}>
                <span>Date du rendez-vous</span>
                <input
                  type="date"
                  value={form.meetingDate}
                  onChange={(event) => updateRoot("meetingDate", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Conseiller</span>
                <input
                  type="text"
                  value={form.advisorName}
                  onChange={(event) => updateRoot("advisorName", event.target.value)}
                  placeholder="Cabinet GP Finances"
                />
              </label>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>2. Emprunteur(s), garanties et quotites</h2>
              <p>Gestion 1 ou 2 emprunteurs avec niveau de couverture detaillé.</p>
            </div>

            <div className={styles.inlineControls}>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={clsx(styles.segmentedButton, form.borrowers.length === 1 && styles.segmentedButtonActive)}
                  onClick={() => setBorrowerCount(1)}
                >
                  1 emprunteur
                </button>
                <button
                  type="button"
                  className={clsx(styles.segmentedButton, form.borrowers.length === 2 && styles.segmentedButtonActive)}
                  onClick={() => setBorrowerCount(2)}
                >
                  2 emprunteurs
                </button>
              </div>
              <p className={styles.inlineHelper}>{QUOTA_HELPER_TEXT}</p>
            </div>

            <div className={styles.borrowerStack}>
              {form.borrowers.map((borrower, index) => (
                <article key={borrower.id} className={styles.borrowerCard}>
                  <header className={styles.borrowerHeader}>
                    <h3>Emprunteur {index + 1}</h3>
                    <span className={styles.borrowerBadge}>Quotite {borrower.quota}%</span>
                  </header>

                  <div className={styles.fieldGridFour}>
                    <label className={styles.field}>
                      <span>Nom</span>
                      <input
                        type="text"
                        value={borrower.lastName}
                        onChange={(event) => updateBorrower(borrower.id, "lastName", event.target.value)}
                        placeholder="Nom"
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Prenom</span>
                      <input
                        type="text"
                        value={borrower.firstName}
                        onChange={(event) => updateBorrower(borrower.id, "firstName", event.target.value)}
                        placeholder="Prenom"
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Age</span>
                      <input
                        type="number"
                        min={18}
                        max={90}
                        value={borrower.age}
                        onChange={(event) => updateBorrower(borrower.id, "age", parseNumericInput(event.target.value))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Quotite (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={borrower.quota}
                        onChange={(event) => updateBorrower(borrower.id, "quota", parseNumericInput(event.target.value))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Profession</span>
                      <input
                        type="text"
                        value={borrower.profession}
                        onChange={(event) => updateBorrower(borrower.id, "profession", event.target.value)}
                        placeholder="Dirigeant, liberal, cadre..."
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Statut fumeur</span>
                      <select
                        value={borrower.smoker ? "yes" : "no"}
                        onChange={(event) => updateBorrower(borrower.id, "smoker", event.target.value === "yes")}
                      >
                        <option value="no">Non fumeur</option>
                        <option value="yes">Fumeur</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.guaranteeGroup}>
                    {GUARANTEE_OPTIONS.map((option) => {
                      const checked = borrower.guarantees.includes(option.code);
                      return (
                        <label key={`${borrower.id}-${option.code}`} className={styles.guaranteePill}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => updateBorrowerGuarantees(borrower.id, option.code)}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeaderInline}>
              <div>
                <h2>3. Prets et assurances comparees</h2>
                <p>Compatible multi-prets pour un meme achat.</p>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={addLoan}>
                + Ajouter un pret
              </button>
            </div>

            <div className={styles.loanStack}>
              {form.loans.map((loan, index) => (
                <article key={loan.id} className={styles.loanCard}>
                  <header className={styles.loanHeader}>
                    <h3>{loan.label || `Pret ${index + 1}`}</h3>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeLoan(loan.id)}
                      disabled={form.loans.length === 1}
                      title={form.loans.length === 1 ? "Au moins un pret est requis" : "Supprimer ce pret"}
                    >
                      Supprimer
                    </button>
                  </header>

                  <div className={styles.fieldGridFour}>
                    <label className={styles.field}>
                      <span>Libelle du pret</span>
                      <input
                        type="text"
                        value={loan.label}
                        onChange={(event) => updateLoan(loan.id, "label", event.target.value)}
                        placeholder={`Pret ${index + 1}`}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Banque</span>
                      <input
                        type="text"
                        value={loan.bank}
                        onChange={(event) => updateLoan(loan.id, "bank", event.target.value)}
                        placeholder="Nom de la banque"
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Montant initial (€)</span>
                      <input
                        type="number"
                        min={0}
                        value={loan.originalAmount}
                        onChange={(event) => updateLoan(loan.id, "originalAmount", parseNumericInput(event.target.value))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Capital restant du (€)</span>
                      <input
                        type="number"
                        min={0}
                        value={loan.outstandingCapital}
                        onChange={(event) =>
                          updateLoan(loan.id, "outstandingCapital", parseNumericInput(event.target.value))
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Duree restante (mois)</span>
                      <input
                        type="number"
                        min={0}
                        value={loan.remainingMonths}
                        onChange={(event) => updateLoan(loan.id, "remainingMonths", parseNumericInput(event.target.value))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Mensualite assurance actuelle (€)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={loan.currentInsuranceMonthly}
                        onChange={(event) =>
                          updateLoan(loan.id, "currentInsuranceMonthly", parseNumericInput(event.target.value))
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Mensualite assurance proposee (€)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={loan.proposedInsuranceMonthly}
                        onChange={(event) =>
                          updateLoan(loan.id, "proposedInsuranceMonthly", parseNumericInput(event.target.value))
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Niveau de garanties</span>
                      <select
                        value={loan.guaranteeTier}
                        onChange={(event) =>
                          updateLoan(
                            loan.id,
                            "guaranteeTier",
                            event.target.value as LoanLine["guaranteeTier"]
                          )
                        }
                      >
                        <option value="Essentiel">Essentiel</option>
                        <option value="Confort">Confort</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>4. Frais et honoraires</h2>
              <p>Ajout des frais de dossier et des honoraires cabinet pour calculer le gain net.</p>
            </div>

            <div className={styles.fieldGridThree}>
              <label className={styles.field}>
                <span>Frais de dossier (€)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fees.applicationFees}
                  onChange={(event) => updateFees("applicationFees", parseNumericInput(event.target.value))}
                />
              </label>

              <label className={styles.field}>
                <span>Honoraires cabinet (€)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fees.advisoryFees}
                  onChange={(event) => updateFees("advisoryFees", parseNumericInput(event.target.value))}
                />
              </label>

              <label className={styles.field}>
                <span>Autres frais (€)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.fees.additionalFees}
                  onChange={(event) => updateFees("additionalFees", parseNumericInput(event.target.value))}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Notes internes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateRoot("notes", event.target.value)}
                placeholder="Commentaires utiles pour le PDF ou le rendez-vous"
              />
            </label>
          </section>
        </div>

        <aside className={styles.resultColumn}>
          <section className={styles.resultCard}>
            <header className={styles.resultHeader}>
              <h2>Synthese instantanee</h2>
              <p>Tous les KPI utiles pour conclure en rendez-vous.</p>
            </header>

            <div className={styles.metricsGrid}>
              <article className={styles.metricCard}>
                <span>Coût actuel</span>
                <strong>{formatCurrencyEuro(summary.currentRemainingCostTotal)}</strong>
                <small>sur la duree restante</small>
              </article>

              <article className={styles.metricCard}>
                <span>Coût propose</span>
                <strong>{formatCurrencyEuro(summary.proposedRemainingCostTotal)}</strong>
                <small>sur la duree restante</small>
              </article>

              <article className={styles.metricCard}>
                <span>Economie mensuelle</span>
                <strong className={savingsToneClass}>{formatCurrencyEuro(summary.monthlySavings)}</strong>
                <small>vs contrat actuel</small>
              </article>

              <article className={styles.metricCard}>
                <span>Economie annuelle</span>
                <strong className={savingsToneClass}>{formatCurrencyEuro(summary.annualSavings)}</strong>
                <small>projection 12 mois</small>
              </article>

              <article className={styles.metricCard}>
                <span>Economie totale</span>
                <strong className={savingsToneClass}>{formatCurrencyEuro(summary.grossSavingsTotal)}</strong>
                <small>avant frais</small>
              </article>

              <article className={styles.metricCard}>
                <span>Gain net client</span>
                <strong className={netGainToneClass}>{formatCurrencyEuro(summary.netGain)}</strong>
                <small>apres frais et honoraires</small>
              </article>
            </div>

            <div className={styles.metricsMeta}>
              <span>Duree moyenne restante: {summary.weightedRemainingYears.toFixed(1)} ans</span>
              <span>Quotite totale: {summary.quotaTotal.toFixed(0)}%</span>
              <span>
                Point de rentabilite: {summary.breakEvenMonths === null ? "non atteint" : `${summary.breakEvenMonths} mois`}
              </span>
            </div>
          </section>

          <section className={styles.resultCard}>
            <header className={styles.resultHeader}>
              <h2>Comparaison visuelle</h2>
              <p>Mensualites assurance actuelle vs nouvelle proposition.</p>
            </header>

            <div className={styles.comparisonBars}>
              <div className={styles.barColumn}>
                <div className={styles.barCurrent} style={{ height: `${currentBarHeight}px` }}>
                  {formatCurrencyEuro(summary.currentMonthlyTotal)}
                </div>
                <span>Actuelle</span>
              </div>

              <div className={styles.barColumn}>
                <div className={styles.barProposed} style={{ height: `${proposedBarHeight}px` }}>
                  {formatCurrencyEuro(summary.proposedMonthlyTotal)}
                </div>
                <span>Nouvelle</span>
              </div>
            </div>
          </section>

          <section className={styles.resultCard}>
            <header className={styles.resultHeader}>
              <h2>Detail par pret</h2>
              <p>Visualisation ligne a ligne pour argumentaire client.</p>
            </header>

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Pret</th>
                    <th>Banque</th>
                    <th>Mensu. actuelle</th>
                    <th>Mensu. proposee</th>
                    <th>Economie totale</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.loans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.label || "-"}</td>
                      <td>{loan.bank || "-"}</td>
                      <td>{formatCurrencyEuro(loan.currentInsuranceMonthly)}</td>
                      <td>{formatCurrencyEuro(loan.proposedInsuranceMonthly)}</td>
                      <td className={loan.totalSavings >= 0 ? styles.valuePositive : styles.valueNegative}>
                        {formatCurrencyEuro(loan.totalSavings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.resultCard}>
            <header className={styles.resultHeader}>
              <h2>Echeancier global emprunteur(s)</h2>
              <p>
                {form.importedGlobalSchedule.length > 0
                  ? "Source: echeancier importe depuis la simulation assureur."
                  : "Source: echeancier estime a partir des donnees saisies."}
              </p>
            </header>

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Annee</th>
                    <th>CRD global</th>
                    <th>Actuelle/an</th>
                    <th>Proposee/an</th>
                    <th>Economie/an</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.globalSchedule.map((row) => (
                    <tr key={`schedule-${row.year}`}>
                      <td>Annee {row.year}</td>
                      <td>{formatCurrencyEuro(row.outstandingCapital)}</td>
                      <td>{formatCurrencyEuro(row.annualCurrentInsurance)}</td>
                      <td>{formatCurrencyEuro(row.annualProposedInsurance)}</td>
                      <td className={row.annualSavings >= 0 ? styles.valuePositive : styles.valueNegative}>
                        {formatCurrencyEuro(row.annualSavings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.pdfPanel}>
            <div>
              <h3>Export PDF 3 pages</h3>
              <p>Couverture premium, details complets, synthese economique et feuille de route.</p>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGeneratePdf}
              disabled={!canGeneratePdf}
            >
              {isGeneratingPdf ? "Generation du PDF..." : "Generer le PDF de simulation"}
            </button>
            {pdfError ? <p className={styles.errorText}>{pdfError}</p> : null}
            {!canGeneratePdf ? (
              <p className={styles.helperText}>Renseigner au minimum nom, prenom et un pret pour activer l&apos;export.</p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
};
