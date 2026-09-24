"use client";

import { FormEvent, useMemo, useState } from "react";
import references from "@/lib/borrower-pricing/references.ts";
import type { QuoteSolution } from "@/lib/borrower-pricing/quote.cjs";
import { CONFIG } from "@/content/site";
import { track, trackCTA } from "@/lib/tracking";
import { Button } from "../ui/Button";

type YesNo = "" | "yes" | "no";
type ProfessionRef = { code: string; title: string };
type PersonState = {
  title: string;
  birthDate: string;
  category: string;
  professionQuery: string;
  profession: ProfessionRef | null;
  share: string;
  smoker: YesNo;
  risks: Record<string, YesNo>;
  hasOther: YesNo;
  otherAmount: string;
};

const emptyPerson = (): PersonState => ({
  title: "", birthDate: "", category: "", professionQuery: "", profession: null, share: "",
  smoker: "", risks: {}, hasOther: "", otherAmount: ""
});
type Result =
  | { kind: "quote"; solutions: QuoteSolution[] }
  | { kind: "call"; message: string }
  | { kind: "error"; message: string };

const PROJECTS = [
  { code: "ResidencePrincipale", label: "Résidence principale" },
  { code: "ResidenceSecondaire", label: "Résidence secondaire" },
  { code: "InvestissementLocatif", label: "Investissement locatif" }
];

const RISKS = [
  { key: "abroadTravel", label: "Effectuez-vous des déplacements professionnels à l’étranger ?", help: "" },
  { key: "aerialOrLandSport", label: "Pratiquez-vous un sport aérien ou terrestre (parachutisme, deltaplane, sports mécaniques…) ?", help: "" },
  { key: "highMileage", label: "Vos déplacements professionnels dépassent-ils 15 000 km par an ?", help: "" },
  { key: "workAtHeight", label: "Travaillez-vous à plus de 15 mètres de hauteur ?", help: "" },
  { key: "heavyLoadHandling", label: "Manipulez-vous régulièrement des charges de plus de 15 kg dans votre métier ?", help: "" }
] as const;

const FIELD = "w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const LABEL = "block text-sm font-semibold text-ink mb-1";
const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const effectiveDate = () => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

function YesNoField({ label, value, onChange, name }: { label: string; value: YesNo; onChange: (v: YesNo) => void; name: string }) {
  return (
    <fieldset className="rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-semibold text-ink">{label}</legend>
      <div className="flex gap-4 pt-1">
        {(["yes", "no"] as const).map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} required />
            {option === "yes" ? "Oui" : "Non"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type PersonProps = { id: string; value: PersonState; onChange: (next: PersonState) => void; co?: boolean };

function PersonIdentity({ id, value, onChange, co }: PersonProps) {
  const patch = (partial: Partial<PersonState>) => onChange({ ...value, ...partial });
  const matches = useMemo(() => {
    const query = normalize(value.professionQuery.trim());
    if (query.length < 2 || value.profession) return [];
    return references.professions.filter((item) => normalize(item.title).includes(query)).slice(0, 8);
  }, [value.professionQuery, value.profession]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={LABEL} htmlFor={`${id}-title`}>Civilité</label>
        <select id={`${id}-title`} className={FIELD} value={value.title} onChange={(e) => patch({ title: e.target.value })} required>
          <option value="">Choisir</option>
          <option value="Madame">Madame</option>
          <option value="Monsieur">Monsieur</option>
        </select>
      </div>
      <div>
        <label className={LABEL} htmlFor={`${id}-birth`}>Date de naissance</label>
        <input id={`${id}-birth`} type="date" className={FIELD} value={value.birthDate} onChange={(e) => patch({ birthDate: e.target.value })} min="1940-01-01" max={new Date().toISOString().slice(0, 10)} required />
      </div>
      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor={`${id}-category`}>Situation professionnelle</label>
        <select id={`${id}-category`} className={FIELD} value={value.category} onChange={(e) => patch({ category: e.target.value })} required>
          <option value="">Choisir</option>
          {references.professionalCategories.map((item) => (
            <option key={item.code} value={item.code}>{item.title}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 relative">
        <label className={LABEL} htmlFor={`${id}-profession`}>{co ? "Profession du second emprunteur" : "Votre profession"}</label>
        <input
          id={`${id}-profession`}
          className={FIELD}
          value={value.professionQuery}
          onChange={(e) => patch({ professionQuery: e.target.value, profession: null })}
          placeholder="Tapez quelques lettres (ex. infirmier, comptable…)"
          autoComplete="off"
          required
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white shadow-soft" role="listbox">
            {matches.map((item) => (
              <li key={item.code}>
                <button type="button" className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-slate-50" onClick={() => patch({ profession: item, professionQuery: item.title })}>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        )}
        {value.profession && <p className="mt-1 text-xs text-muted">Profession sélectionnée.</p>}
      </div>
      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor={`${id}-share`}>
          {co ? "Quotité du second emprunteur" : "Votre quotité"} <span className="font-normal text-muted">(facultatif, 100 % si vide)</span>
        </label>
        <div className="flex max-w-[180px] items-center gap-2">
          <input id={`${id}-share`} className={FIELD} inputMode="numeric" placeholder="100" value={value.share} onChange={(e) => patch({ share: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
          <span className="text-sm font-semibold text-muted">%</span>
        </div>
        <p className="mt-1 text-xs text-muted">Part du prêt couverte pour cette personne. À deux : 100 % chacun, ou une répartition (ex. 50 % / 50 %) dont la somme atteint au moins 100 %.</p>
      </div>
    </div>
  );
}

function PersonProfile({ id, value, onChange }: PersonProps) {
  const patch = (partial: Partial<PersonState>) => onChange({ ...value, ...partial });
  return (
    <div className="space-y-4">
      <YesNoField name={`${id}-smoker`} label="Êtes-vous fumeur (y compris cigarette électronique) ?" value={value.smoker} onChange={(v) => patch({ smoker: v })} />
      {RISKS.map((risk) => (
        <YesNoField key={risk.key} name={`${id}-${risk.key}`} label={risk.label} value={value.risks[risk.key] ?? ""} onChange={(v) => patch({ risks: { ...value.risks, [risk.key]: v } })} />
      ))}
      <YesNoField name={`${id}-other`} label="Avez-vous d’autres crédits en cours déjà assurés ?" value={value.hasOther} onChange={(v) => patch({ hasOther: v })} />
      {value.hasOther === "yes" && (
        <div>
          <label className={LABEL} htmlFor={`${id}-other-amount`}>Capital restant dû total de ces autres crédits (€)</label>
          <input id={`${id}-other-amount`} className={FIELD} inputMode="decimal" value={value.otherAmount} onChange={(e) => patch({ otherAmount: e.target.value })} required />
        </div>
      )}
    </div>
  );
}

export const BorrowerQuoteForm = () => {
  const [main, setMain] = useState<PersonState>(emptyPerson);
  const [co, setCo] = useState<PersonState>(emptyPerson);
  const [hasCo, setHasCo] = useState<YesNo>("");
  const [postCode, setPostCode] = useState("");
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState("ResidencePrincipale");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [twoBorrowers, setTwoBorrowers] = useState(false);
  const [consent, setConsent] = useState(false);

  const toPayload = (state: PersonState, label: string): { error: string } | { person: Record<string, unknown>; share: number } => {
    if (!state.profession) return { error: `Choisissez la profession ${label} dans la liste proposée.` };
    const rawShare = state.share.trim();
    const share = rawShare === "" ? 100 : Number(rawShare);
    if (!Number.isInteger(share) || share < 1 || share > 100) return { error: `La quotité ${label} doit être un nombre entier entre 1 et 100 %.` };
    const other = state.hasOther === "yes" ? Number(state.otherAmount.replace(/\s/g, "").replace(",", ".")) : 0;
    if (!Number.isFinite(other) || other < 0) return { error: `Indiquez le montant des autres crédits assurés ${label}.` };
    const riskAnswers = Object.fromEntries(RISKS.map((risk) => [risk.key, state.risks[risk.key] === "yes"]));
    return {
      share,
      person: {
        title: state.title,
        birthDate: state.birthDate,
        professionalCategory: state.category,
        profession: state.profession.code,
        smoker: state.smoker === "yes",
        otherInsuredOutstanding: other,
        coveragePercentage: share,
        ...riskAnswers
      }
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!consent) return setFormError("Cochez la case de consentement pour obtenir votre estimation.");
    const first = toPayload(main, "de l’emprunteur");
    if ("error" in first) return setFormError(first.error);
    const second = hasCo === "yes" ? toPayload(co, "du second emprunteur") : null;
    if (second && "error" in second) return setFormError(second.error);
    const totalShare = first.share + (second ? second.share : 0);
    if (totalShare < 100) return setFormError(`La somme des quotités est de ${totalShare} % : le prêt doit être couvert à 100 % au moins. Augmentez une quotité ou ajoutez un second emprunteur.`);
    const capital = Number(amount.replace(/\s/g, "").replace(",", "."));
    const remainingMonths = Number(months);
    const interest = Number(rate.replace(",", "."));
    if (!Number.isFinite(capital) || capital < 1000) return setFormError("Indiquez le capital restant dû (au moins 1 000 €).");
    if (!Number.isInteger(remainingMonths) || remainingMonths < 12 || remainingMonths > 420) return setFormError("La durée restante doit être comprise entre 12 et 420 mois.");
    if (!Number.isFinite(interest) || interest < 0 || interest > 15) return setFormError("Indiquez le taux d’intérêt de votre prêt (entre 0 et 15 %).");

    setLoading(true);
    setResult(null);
    setTwoBorrowers(Boolean(second));
    try {
      const response = await fetch("/api/assurance-emprunteur/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { postCode, city },
          projectType,
          effectiveDate: effectiveDate(),
          consent: true,
          person: first.person,
          ...(second ? { coBorrower: second.person } : {}),
          loan: { loanType: "Classique", borrowedAmount: capital, loanDuration: remainingMonths, interestRate: interest }
        })
      });
      if (response.status === 429) {
        setResult({ kind: "error", message: "Trop de simulations en peu de temps. Réessayez dans quelques minutes ou appelez-nous." });
        return;
      }
      const data = await response.json();
      if (data.status === "quote" && Array.isArray(data.solutions)) {
        setResult({ kind: "quote", solutions: data.solutions });
        track("borrower_quote_result", { solutions: data.solutions.length, borrowers: second ? 2 : 1 });
      } else {
        setResult({ kind: "call", message: data.message ?? "Appelez GP FINANCES, nous affinons votre étude avec vous." });
        track("borrower_quote_call");
      }
    } catch {
      setResult({ kind: "error", message: "Le service est momentanément indisponible. Appelez-nous, nous vous répondons directement." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">1. Vous</h2>
          <PersonIdentity id="bq-main" value={main} onChange={setMain} />
          <YesNoField name="bq-has-co" label="Le prêt est-il souscrit à deux (couple, associé…) ?" value={hasCo} onChange={setHasCo} />
          {hasCo === "yes" && (
            <div className="space-y-4 rounded-2xl border border-dashed border-border bg-slate-50/60 p-4 sm:p-5">
              <h3 className="text-base font-bold text-ink">Second emprunteur</h3>
              <p className="text-sm text-muted">
                Renseignez ses informations comme pour vous. Vous pouvez répartir la quotité de chacun (par exemple 50 % / 50 %, ou 100 % chacun).
              </p>
              <PersonIdentity id="bq-co" value={co} onChange={setCo} co />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="bq-postcode">Code postal</label>
              <input id="bq-postcode" className={FIELD} inputMode="numeric" pattern="\d{5}" maxLength={5} value={postCode} onChange={(e) => setPostCode(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div>
              <label className={LABEL} htmlFor="bq-city">Ville</label>
              <input id="bq-city" className={FIELD} value={city} onChange={(e) => setCity(e.target.value.replace(/[{}<>]/g, ""))} maxLength={80} required />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">2. Votre prêt actuel</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="bq-project">Nature du projet financé</label>
              <select id="bq-project" className={FIELD} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {PROJECTS.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="bq-amount">Capital restant dû (€)</label>
              <input id="bq-amount" className={FIELD} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex. 180 000" required />
              <p className="mt-1 text-xs text-muted">Indiqué sur votre dernier tableau d’amortissement ou relevé bancaire. Pour un prêt à deux, le capital restant dû total du prêt.</p>
            </div>
            <div>
              <label className={LABEL} htmlFor="bq-months">Durée restante (mois)</label>
              <input id="bq-months" className={FIELD} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} placeholder="ex. 150" required />
              <p className="mt-1 text-xs text-muted">15 ans restants = 180 mois.</p>
            </div>
            <div>
              <label className={LABEL} htmlFor="bq-rate">Taux d’intérêt du prêt (%)</label>
              <input id="bq-rate" className={FIELD} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="ex. 1,9" required />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink">3. Votre profil</h2>
          <PersonProfile id="bq-main" value={main} onChange={setMain} />
          {hasCo === "yes" && (
            <div className="space-y-4 rounded-2xl border border-dashed border-border bg-slate-50/60 p-4 sm:p-5">
              <h3 className="text-base font-bold text-ink">Profil du second emprunteur</h3>
              <PersonProfile id="bq-co" value={co} onChange={setCo} co />
            </div>
          )}
        </section>

        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>
            J’accepte que GP FINANCES traite ces informations, y compris mon statut fumeur et mes réponses sur mes activités (données de santé), pour établir mon estimation, et qu’elles soient transmises à l’assureur partenaire pour calculer le tarif, sans mon nom ni mes coordonnées.{" "}
            <a href="/politique-de-confidentialite" className="underline" target="_blank" rel="noreferrer">Politique de confidentialité</a>
          </span>
        </label>
        {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Calcul en cours…" : "Obtenir mon estimation"}
        </Button>
        <p className="text-xs text-muted">
          Estimation indicative, sans engagement. Nous ne demandons ni votre nom, ni votre e-mail, ni votre téléphone. Vos réponses sont transmises à GP FINANCES et conservées 12 mois au maximum.
        </p>
      </form>

      {result?.kind === "quote" && <Solutions solutions={result.solutions} twoBorrowers={twoBorrowers} />}
      {(result?.kind === "call" || result?.kind === "error") && (
        <div role="status" className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-8">
          <p className="text-base font-semibold text-ink">{result.message}</p>
          <ContactButtons />
        </div>
      )}
    </div>
  );
};

function ContactButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button href="tel:+33651224213" onClick={() => trackCTA("borrower_quote_call")}>Appeler le 06 51 22 42 13</Button>
      <Button href={CONFIG.CALENDLY_URL} variant="secondary" onClick={() => trackCTA("borrower_quote_rdv")}>Prendre rendez-vous</Button>
    </div>
  );
}

function Solutions({ solutions, twoBorrowers }: { solutions: QuoteSolution[]; twoBorrowers: boolean }) {
  return (
    <section className="space-y-4" aria-live="polite">
      <h2 className="text-xl font-bold text-ink">Votre estimation : {solutions.length > 1 ? `nos ${solutions.length} meilleures solutions` : "notre meilleure solution"}</h2>
      <p className="text-sm text-muted">
        Coût total de l’assurance sur la durée restante du prêt, à garanties identiques pour toutes les solutions : DC, PTIA, ITT, IPT, IPP et MNO (maladies non objectivables : dos et psychisme, au niveau Confort Plus). Classement du moins cher au plus cher.
        {twoBorrowers ? " Tarif cumulé pour les deux emprunteurs." : ""}
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {solutions.map((solution) => (
          <article key={solution.rank} className={`rounded-2xl border bg-white p-5 shadow-soft ${solution.rank === 1 ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
            <p className="text-sm font-semibold text-primary">{solution.name}{solution.rank === 1 ? " · la plus avantageuse" : ""}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{euro(solution.total)}</p>
            <p className="text-xs text-muted">coût total estimé sur la durée</p>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">
              Cotisation moyenne : {euro(solution.averageMonthly)}<span className="font-normal text-muted"> / mois</span>
            </p>
            <dl className="mt-4 space-y-1 text-sm text-ink">
              <div className="flex justify-between gap-2"><dt className="text-muted">Première année</dt><dd>{solution.firstYear != null ? euro(solution.firstYear) : "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Sur 8 ans</dt><dd>{solution.eightYears != null ? euro(solution.eightYears) : "—"}</dd></div>
              {solution.taea != null && <div className="flex justify-between gap-2"><dt className="text-muted">TAEA</dt><dd>{solution.taea.toString().replace(".", ",")} %</dd></div>}
            </dl>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">
              {solution.contributionBasis === "capital_restant_du"
                ? "Cotisations calculées sur le capital restant dû : elles baissent avec le temps."
                : "Cotisations calculées sur le capital initial : montant stable pendant toute la durée."}
            </p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted">
        Estimation indicative, non contractuelle : le tarif définitif dépend de l’acceptation de votre dossier et de l’équivalence de garanties exigée par votre banque. Comparez ce montant avec le coût restant de votre assurance actuelle.
      </p>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-8 space-y-3">
        <p className="font-semibold text-ink">Je m’occupe de toutes les démarches, y compris la résiliation de votre ancien contrat.</p>
        <ContactButtons />
      </div>
    </section>
  );
}
