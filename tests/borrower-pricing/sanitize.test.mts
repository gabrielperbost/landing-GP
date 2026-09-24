import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeQuoteInput } from "../../src/lib/borrower-pricing/sanitize.ts";
import { allowRequest } from "../../src/lib/borrower-pricing/rateLimit.ts";

const now = new Date("2026-09-24T10:00:00Z");
const body = () => ({
  consent: true,
  address: { postCode: "38000", city: "GRENOBLE" },
  projectType: "ResidencePrincipale",
  effectiveDate: "2026-10-01",
  person: { title: "Monsieur", birthDate: "1985-01-01", professionalCategory: "CadreAssimileCadre", profession: "AgentCommercial",
    smoker: false, abroadTravel: false, aerialOrLandSport: false, highMileage: false, workAtHeight: false, heavyLoadHandling: false, otherInsuredOutstanding: 0 },
  loan: { loanType: "Classique", borrowedAmount: 180000, loanDuration: 150, interestRate: 1.9 },
});

test("payload valide accepté, offre non lue depuis le navigateur", () => {
  const input = sanitizeQuoteInput({ ...body(), commission: "0808", productCode: "X", email: "a@b.fr" }, now)!;
  assert.ok(input);
  assert.equal(JSON.stringify(input).includes("0808"), false);
  assert.equal("email" in input, false);
  assert.equal((input.person as any).coveragePercentage, 100);
});
test("codes inconnus, dates hors plage, risques absents : refus", () => {
  const cases: ((b: any) => void)[] = [
    (b) => { b.person.profession = "Inventee"; },
    (b) => { b.person.professionalCategory = "X"; },
    (b) => { b.projectType = "PretConsommation"; },
    (b) => { b.effectiveDate = "2026-09-01"; },
    (b) => { b.effectiveDate = "2028-01-01"; },
    (b) => { delete b.person.highMileage; },
    (b) => { b.person.smoker = "false"; },
    (b) => { delete b.person.otherInsuredOutstanding; },
    (b) => { b.person.otherInsuredOutstanding = -5; },
    (b) => { b.address.city = "<script>"; },
  ];
  for (const mutate of cases) { const b = body(); mutate(b); assert.equal(sanitizeQuoteInput(b, now), null); }
  for (const v of [null, [], "x", 3]) assert.equal(sanitizeQuoteInput(v, now), null);
});
test("quotité : 100 % par défaut, valeurs hors 1-100 refusées ; second emprunteur validé comme le premier", () => {
  const ok = sanitizeQuoteInput(body(), now)!;
  assert.equal((ok.person as any).coveragePercentage, 100);
  assert.equal("coBorrower" in ok, false);
  const b: any = body();
  b.person.coveragePercentage = 60;
  b.coBorrower = { ...body().person, title: "Madame", coveragePercentage: 40 };
  const two = sanitizeQuoteInput(b, now)!;
  assert.equal((two.person as any).coveragePercentage, 60);
  assert.equal((two.coBorrower as any).coveragePercentage, 40);
  for (const bad of [0, 101, "100", -5]) { const c: any = body(); c.person.coveragePercentage = bad; assert.equal(sanitizeQuoteInput(c, now), null); }
  const missingRisk: any = body(); missingRisk.coBorrower = { ...body().person }; delete missingRisk.coBorrower.smoker;
  assert.equal(sanitizeQuoteInput(missingRisk, now), null);
  const badProfession: any = body(); badProfession.coBorrower = { ...body().person, profession: "Inventee" };
  assert.equal(sanitizeQuoteInput(badProfession, now), null);
});
test("sans consentement explicite, aucune donnée n'est acceptée", () => {
  for (const consent of [undefined, false, "true", 1]) { const b: any = body(); b.consent = consent; assert.equal(sanitizeQuoteInput(b, now), null); }
});
test("limiteur : refus au-delà de la limite, reprise après la fenêtre", () => {
  for (let i = 0; i < 6; i++) assert.equal(allowRequest("k", 6, 1000, 0), true);
  assert.equal(allowRequest("k", 6, 1000, 500), false);
  assert.equal(allowRequest("k", 6, 1000, 1500), true);
});
