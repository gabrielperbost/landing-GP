"use client";

import { useMemo, useState } from "react";
import styles from "./PerSimulationPreview.module.css";

type Answers = {
  profession: string | null;
  family: string | null;
  income: number | null;
  taxPaid: number | null;
  retirement: string | null;
  goal: string | null;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
};

type Result = {
  saving: number;
  parts: number;
  tmi: number;
  suggestedPayment: number;
};

const MAX_STEP = 8;

const INITIAL_ANSWERS: Answers = {
  profession: null,
  family: null,
  income: null,
  taxPaid: null,
  retirement: null,
  goal: null,
  firstname: "",
  lastname: "",
  phone: "",
  email: ""
};

const PROFESSION_OPTIONS = [
  { label: "Salarié", value: "salarie" },
  { label: "Indépendant / TNS", value: "tns" },
  { label: "Dirigeant d’entreprise", value: "dirigeant" },
  { label: "Profession libérale", value: "liberal" }
];

const FAMILY_OPTIONS = [
  { label: "Célibataire sans enfant", value: "single_0" },
  { label: "Célibataire avec 1 enfant", value: "single_1" },
  { label: "Célibataire avec 2 enfants", value: "single_2" },
  { label: "Célibataire avec 3 enfants", value: "single_3" },
  { label: "Marié / Pacsé sans enfant", value: "married_0" },
  { label: "Marié / Pacsé avec 1 enfant", value: "married_1" },
  { label: "Marié / Pacsé avec 2 enfants", value: "married_2" },
  { label: "Marié / Pacsé avec 3 enfants", value: "married_3" }
];

const RETIREMENT_OPTIONS = [
  { label: "Moins de 10 ans", value: "moins_10" },
  { label: "Entre 10 et 20 ans", value: "10_20" },
  { label: "Plus de 20 ans", value: "plus_20" },
  { label: "Je ne sais pas encore", value: "unknown" }
];

const GOAL_OPTIONS = [
  { label: "Réduire mes impôts", value: "reduce_tax" },
  { label: "Préparer ma retraite", value: "retirement" },
  { label: "Placer une somme disponible", value: "invest" },
  { label: "Comparer avec l’assurance-vie", value: "compare" }
];

function getParts(family: string | null): number {
  const map: Record<string, number> = {
    single_0: 1,
    single_1: 1.5,
    single_2: 2,
    single_3: 3,
    married_0: 2,
    married_1: 2.5,
    married_2: 3,
    married_3: 4
  };

  if (!family) return 1;
  return map[family] || 1;
}

function getTmi(income: number, parts: number): number {
  const quotient = income / parts;
  if (quotient <= 11497) return 0;
  if (quotient <= 29315) return 11;
  if (quotient <= 83823) return 30;
  if (quotient <= 180294) return 41;
  return 45;
}

function estimateRecommendedPayment(income: number, taxPaid: number, tmi: number): number {
  if (tmi === 0 || taxPaid < 1000) return 0;
  if (taxPaid < 3000) return 3000;
  if (taxPaid < 6000) return 6000;
  if (taxPaid < 10000) return 10000;
  return Math.round(Math.min(15000, income * 0.1));
}

export function PerSimulationPreview() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [incomeInput, setIncomeInput] = useState("");
  const [taxPaidInput, setTaxPaidInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const progressWidth = useMemo(() => ((currentStep - 1) / (MAX_STEP - 1)) * 100, [currentStep]);

  const setOption = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const calculateResult = () => {
    const income = Number(incomeInput);
    const taxPaid = Number(taxPaidInput);
    const parts = getParts(answers.family);
    const tmi = getTmi(income, parts);
    const suggestedPayment = estimateRecommendedPayment(income, taxPaid, tmi);

    let saving = Math.round(suggestedPayment * (tmi / 100));
    if (saving > taxPaid) saving = taxPaid;

    setAnswers((prev) => ({ ...prev, income, taxPaid }));
    setResult({ saving, parts, tmi, suggestedPayment });
  };

  const validateStep = (): boolean => {
    if (currentStep === 1 && !answers.profession) {
      alert("Sélectionnez votre situation professionnelle.");
      return false;
    }

    if (currentStep === 2 && !answers.family) {
      alert("Sélectionnez votre situation familiale.");
      return false;
    }

    if (currentStep === 3) {
      const income = Number(incomeInput);
      if (!income || income < 10000) {
        alert("Indiquez votre revenu net imposable annuel.");
        return false;
      }
    }

    if (currentStep === 4) {
      const taxPaid = Number(taxPaidInput);
      if (Number.isNaN(taxPaid) || taxPaid < 0 || !taxPaidInput.trim()) {
        alert("Indiquez votre montant d’impôt annuel.");
        return false;
      }
    }

    if (currentStep === 5 && !answers.retirement) {
      alert("Sélectionnez votre horizon de retraite.");
      return false;
    }

    if (currentStep === 6 && !answers.goal) {
      alert("Sélectionnez votre objectif principal.");
      return false;
    }

    if (currentStep === 7) {
      if (!answers.firstname.trim() || !answers.lastname.trim() || !answers.phone.trim() || !answers.email.trim()) {
        alert("Complétez vos coordonnées pour afficher la simulation.");
        return false;
      }

      calculateResult();
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 8) {
      alert("Merci. Votre demande d’étude personnalisée est enregistrée.");
      return;
    }

    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <main className={styles.shell}>
      <div className={styles.app}>
        <div className={styles.badge}>Simulation PER gratuite · 6 questions</div>
        <h1 className={styles.title}>Découvrez combien vous pourriez potentiellement économiser grâce au PER</h1>
        <p className={styles.subtitle}>
          Répondez à quelques questions pour obtenir une estimation indicative de votre avantage fiscal potentiel.
        </p>

        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${progressWidth}%` }} />
        </div>

        {currentStep === 1 && (
          <section>
            <h2 className={styles.questionTitle}>1. Quelle est votre situation professionnelle ?</h2>
            <div className={styles.options}>
              {PROFESSION_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.option} ${answers.profession === option.value ? styles.optionSelected : ""}`}
                  onClick={() => setOption("profession", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h2 className={styles.questionTitle}>2. Quelle est votre situation familiale ?</h2>
            <div className={styles.options}>
              {FAMILY_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.option} ${answers.family === option.value ? styles.optionSelected : ""}`}
                  onClick={() => setOption("family", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section>
            <h2 className={styles.questionTitle}>3. Quel est votre revenu net imposable annuel ?</h2>
            <input
              type="number"
              className={styles.input}
              placeholder="Exemple : 72000"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
            />
          </section>
        )}

        {currentStep === 4 && (
          <section>
            <h2 className={styles.questionTitle}>4. Combien payez-vous environ d’impôts par an ?</h2>
            <input
              type="number"
              className={styles.input}
              placeholder="Exemple : 8400"
              value={taxPaidInput}
              onChange={(event) => setTaxPaidInput(event.target.value)}
            />
          </section>
        )}

        {currentStep === 5 && (
          <section>
            <h2 className={styles.questionTitle}>5. Quel est votre horizon de retraite ?</h2>
            <div className={styles.options}>
              {RETIREMENT_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.option} ${answers.retirement === option.value ? styles.optionSelected : ""}`}
                  onClick={() => setOption("retirement", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === 6 && (
          <section>
            <h2 className={styles.questionTitle}>6. Votre objectif principal ?</h2>
            <div className={styles.options}>
              {GOAL_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.option} ${answers.goal === option.value ? styles.optionSelected : ""}`}
                  onClick={() => setOption("goal", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === 7 && (
          <section>
            <h2 className={styles.questionTitle}>Votre estimation est prête</h2>
            <p className={styles.subtitle}>Indiquez vos coordonnées pour afficher votre simulation personnalisée.</p>
            <input
              type="text"
              className={styles.input}
              placeholder="Prénom"
              value={answers.firstname}
              onChange={(event) => setAnswers((prev) => ({ ...prev, firstname: event.target.value }))}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Nom"
              value={answers.lastname}
              onChange={(event) => setAnswers((prev) => ({ ...prev, lastname: event.target.value }))}
            />
            <input
              type="tel"
              className={styles.input}
              placeholder="Téléphone"
              value={answers.phone}
              onChange={(event) => setAnswers((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <input
              type="email"
              className={styles.input}
              placeholder="Email"
              value={answers.email}
              onChange={(event) => setAnswers((prev) => ({ ...prev, email: event.target.value }))}
            />
            <p className={styles.small}>
              Vos informations permettront à un conseiller GP Finances de vous recontacter pour affiner l’étude.
            </p>
          </section>
        )}

        {currentStep === 8 && result && (
          <section>
            <h2 className={styles.questionTitle}>Votre économie fiscale potentielle estimée</h2>
            <div className={styles.resultBox}>
              Montant estimé :
              <strong className={styles.resultAmount}>{result.saving.toLocaleString("fr-FR")} €</strong>
              par an
            </div>

            <p
              className={styles.details}
              dangerouslySetInnerHTML={{
                __html: `
                Votre foyer fiscal est estimé à <strong>${result.parts} part(s)</strong>.<br>
                Votre tranche marginale d’imposition estimée est de <strong>${result.tmi} %</strong>.<br>
                Montant de versement PER simulé : <strong>${result.suggestedPayment.toLocaleString("fr-FR")} €</strong>.<br><br>
                Cette première estimation permet d’identifier un potentiel fiscal, mais elle doit être confirmée avec votre plafond PER disponible et votre situation exacte.
              `
              }}
            />

            <p className={styles.small}>
              Simulation indicative, non contractuelle. L’économie réelle dépend de votre situation fiscale, de votre
              plafond PER disponible, du montant effectivement versé et de la réglementation applicable.
            </p>
          </section>
        )}

        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={handlePrev}
            style={{ display: currentStep === 1 ? "none" : "block" }}
          >
            Retour
          </button>
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={handleNext}>
            {currentStep === 7
              ? "Afficher ma simulation"
              : currentStep === 8
                ? "Demander mon étude personnalisée"
                : "Continuer"}
          </button>
        </div>
      </div>
    </main>
  );
}
