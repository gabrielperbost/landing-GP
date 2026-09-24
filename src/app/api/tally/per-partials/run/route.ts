import { NextRequest, NextResponse } from "next/server";
import {
  extractTallyPerLead,
  getPerImportSecret,
  getPerSequenceSecret,
  getPerWebhookSecret,
  ingestPerCampaignLead
} from "@/lib/tallyPerCampaign";
import { normalizeEnv } from "@/lib/monday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TallyQuestion = {
  id: string;
  title?: string;
  fields?: Array<{ title?: string; uuid?: string }>;
};

type TallyResponse = {
  id?: string;
  questionId?: string;
  answer?: unknown;
  formattedAnswer?: string;
  updatedAt?: string;
};

type TallySubmission = {
  id: string;
  formId: string;
  isCompleted: boolean;
  submittedAt?: string;
  responses?: TallyResponse[];
};

type TallySubmissionsPayload = {
  questions?: TallyQuestion[];
  submissions?: TallySubmission[];
};

const getBaseUrl = (request: NextRequest) =>
  (process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`).replace(/\/+$/, "");

const getProvidedSecret = (request: NextRequest) => {
  const url = new URL(request.url);
  return (
    request.headers.get("x-per-partials-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret")
  );
};

const isAuthorized = (request: NextRequest) => {
  const expectedSecrets = [getPerImportSecret(), getPerSequenceSecret(), getPerWebhookSecret()].filter(Boolean);
  if (expectedSecrets.length === 0) return true;
  const provided = getProvidedSecret(request)?.trim();
  return Boolean(provided && expectedSecrets.includes(provided));
};

const getTallyApiKey = () =>
  normalizeEnv(process.env.PER_TALLY_API_KEY) ??
  normalizeEnv(process.env.TALLY_API_KEY) ??
  normalizeEnv(process.env.TALLY_ACCESS_TOKEN);

const getTallyFormId = () => normalizeEnv(process.env.PER_TALLY_FORM_ID) ?? normalizeEnv(process.env.TALLY_FORM_ID);

const parseLimit = (request: NextRequest) => {
  const value = Number(new URL(request.url).searchParams.get("limit") || process.env.PER_TALLY_PARTIALS_LIMIT || "100");
  if (!Number.isFinite(value) || value < 1) return 100;
  return Math.min(Math.floor(value), 500);
};

const getStartDate = (request: NextRequest) => {
  const explicit = new URL(request.url).searchParams.get("startDate");
  if (explicit) return explicit;

  const lookbackHours = Number(process.env.PER_TALLY_PARTIALS_LOOKBACK_HOURS || "72");
  const date = new Date();
  date.setUTCHours(date.getUTCHours() - (Number.isFinite(lookbackHours) && lookbackHours > 0 ? lookbackHours : 72));
  return date.toISOString();
};

const normalizeAnswer = (response: TallyResponse) => {
  if (response.formattedAnswer) return response.formattedAnswer;
  if (Array.isArray(response.answer)) return response.answer.join(", ");
  if (response.answer && typeof response.answer === "object") return JSON.stringify(response.answer);
  return String(response.answer ?? "").trim();
};

const buildQuestionMap = (questions: TallyQuestion[] = []) => {
  const map = new Map<string, TallyQuestion>();
  questions.forEach((question) => {
    if (question.id) map.set(question.id, question);
    question.fields?.forEach((field) => {
      if (field.uuid) map.set(field.uuid, question);
    });
  });
  return map;
};

const partialSubmissionToWebhookPayload = ({
  submission,
  questions
}: {
  submission: TallySubmission;
  questions: TallyQuestion[];
}) => {
  const questionMap = buildQuestionMap(questions);
  const fields =
    submission.responses?.map((response) => {
      const question = response.questionId ? questionMap.get(response.questionId) : undefined;
      const fieldTitles = question?.fields?.map((field) => field.title).filter(Boolean).join(" ");
      return {
        key: response.questionId || response.id || "",
        label: [question?.title, fieldTitles].filter(Boolean).join(" "),
        type: "",
        value: normalizeAnswer(response)
      };
    }) ?? [];

  return {
    eventId: `partial:${submission.id}`,
    eventType: "FORM_RESPONSE_PARTIAL",
    createdAt: submission.submittedAt || new Date().toISOString(),
    data: {
      responseId: `partial:${submission.id}`,
      submissionId: `partial:${submission.id}`,
      formId: submission.formId,
      formName: "Tally partial submission",
      fields
    }
  };
};

const fetchTallyPartials = async (request: NextRequest) => {
  const apiKey = getTallyApiKey();
  const formId = getTallyFormId();
  if (!apiKey) throw new Error("TALLY_API_KEY missing");
  if (!formId) throw new Error("PER_TALLY_FORM_ID missing");

  const url = new URL(`https://api.tally.so/forms/${encodeURIComponent(formId)}/submissions`);
  url.searchParams.set("filter", "partial");
  url.searchParams.set("limit", String(parseLimit(request)));
  url.searchParams.set("startDate", getStartDate(request));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Tally API HTTP ${response.status}`);
  }

  return (await response.json()) as TallySubmissionsPayload;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const payload = await fetchTallyPartials(request);
    const submissions = (payload.submissions ?? []).filter((submission) => !submission.isCompleted);
    const results: Array<{ submissionId: string; action: string; mondayItemId?: string; error?: string }> = [];

    for (const submission of submissions) {
      try {
        const leadPayload = partialSubmissionToWebhookPayload({
          submission,
          questions: payload.questions ?? []
        });
        const lead = extractTallyPerLead(leadPayload);

        if (!lead.email) {
          results.push({ submissionId: submission.id, action: "skipped_missing_email" });
          continue;
        }

        const result = await ingestPerCampaignLead({ lead, baseUrl: getBaseUrl(request) });
        results.push({
          submissionId: submission.id,
          action: result.ok ? result.action : result.error,
          mondayItemId: result.ok ? result.mondayItemId : undefined
        });
      } catch (error) {
        results.push({
          submissionId: submission.id,
          action: "error",
          error: error instanceof Error ? error.message : "unknown_error"
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: submissions.length,
      processed: results.filter((result) => result.action !== "skipped_missing_email").length,
      results
    });
  } catch (error) {
    console.error("per-tally-partials-import-error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 }
    );
  }
}

export const POST = GET;
