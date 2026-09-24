import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  DEPOT_REMINDER_DAY_OFFSETS,
  buildDepotReminderEmail,
  type DepotReminderDayOffset
} from "@/lib/depotReminderEmailTemplates";
import {
  countSentRemindersForSession,
  getDueSessionReminders,
  getReminderSession,
  markReminderAsFailed,
  markReminderAsSent,
  markReminderAsSkipped
} from "@/lib/depotReminderStore";
import { buildClientAccessLink, isPerSessionBank } from "@/lib/depotSession";
import {
  findItemColumnValue,
  getBoardColumns,
  getItemById,
  normalizeEnv,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
import { PER_DOSSIER_ACCESS_PATH } from "@/lib/perDossier";
import { buildPerDossierReminderEmail } from "@/lib/perDossierReminderEmailTemplates";
import { getSavingsCounter } from "@/lib/savingsCounterStore";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parsePositiveInt = (value: string | undefined, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
};

const getSiteBaseUrl = () => (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");

const getReminderSecret = () => normalizeEnv(process.env.DEPOT_REMINDER_CRON_SECRET) ?? normalizeEnv(process.env.CRON_SECRET);
const isReminderFallbackEnabled = () => normalizeEnv(process.env.DEPOT_REMINDER_FALLBACK_ENABLED) === "true";

const isAuthorized = (request: NextRequest) => {
  const secret = getReminderSecret();
  if (!secret) return true;

  const searchParams = new URL(request.url).searchParams;
  const providedSecret =
    request.headers.get("x-depot-reminder-cron-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    searchParams.get("secret");

  return providedSecret?.trim() === secret;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseReminderCount = (value: string | null | undefined) => {
  if (!value) return 0;
  const normalized = value.replaceAll(/[^\d]/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getUtcDayWindow = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    dayKey: start.toISOString().slice(0, 10),
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
};

const buildDailyEmailKey = (email: string, dayKey: string) => `${normalizeEmail(email)}|${dayKey}`;

const getAlreadyRemindedTodayEmailKeys = async ({
  startIso,
  endIso,
  dayKey
}: {
  startIso: string;
  endIso: string;
  dayKey: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("session_reminders")
    .select("sessions!inner(client_email)")
    .eq("status", "sent")
    .gte("sent_at", startIso)
    .lt("sent_at", endIso)
    .limit(5000);

  if (error) {
    throw new Error(`get_already_reminded_today_failed:${error.message}`);
  }

  const keys = new Set<string>();
  for (const row of data ?? []) {
    const clientEmail = (row as { sessions?: { client_email?: string | null } | null }).sessions?.client_email?.trim();
    if (!clientEmail) continue;
    keys.add(buildDailyEmailKey(clientEmail, dayKey));
  }
  return keys;
};

const isMissingSessionRemindersTableError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("session_reminders") && (message.includes("schema cache") || message.includes("does not exist"));
};

type FallbackSessionRow = {
  id: string;
  token: string;
  monday_item_id: string;
  client_name: string;
  client_email: string;
  bank: string | null;
  status: string;
  token_expires_at: string;
  created_at: string;
};

type FallbackDueReminder = {
  session: FallbackSessionRow;
  dayOffset: DepotReminderDayOffset;
  currentReminderCount: number;
};

const getDueFallbackReminders = async ({ limit }: { limit: number }): Promise<FallbackDueReminder[]> => {
  const now = new Date();
  const oldestDueBoundary = addDays(now, -DEPOT_REMINDER_DAY_OFFSETS[0]).toISOString();
  const fetchLimit = Math.min(Math.max(limit * 6, 120), 500);

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id,token,monday_item_id,client_name,client_email,bank,status,token_expires_at,created_at")
    .in("status", ["pending", "password_set"])
    .lte("created_at", oldestDueBoundary)
    .order("created_at", { ascending: true })
    .limit(fetchLimit);

  if (error) {
    throw new Error(`fallback_sessions_query_failed:${error.message}`);
  }

  const sessions = (data ?? []) as FallbackSessionRow[];
  const due: FallbackDueReminder[] = [];
  const boardColumnsCache = new Map<string, Awaited<ReturnType<typeof getBoardColumns>>>();

  for (const session of sessions) {
    if (due.length >= limit) break;

    if (!session.monday_item_id || !session.token || !session.client_email) {
      continue;
    }
    if (new Date(session.token_expires_at) < now) {
      continue;
    }

    const item = await getItemById(session.monday_item_id);
    if (!item) {
      continue;
    }

    let boardColumns = boardColumnsCache.get(item.board.id);
    if (!boardColumns) {
      boardColumns = await getBoardColumns(item.board.id);
      boardColumnsCache.set(item.board.id, boardColumns);
    }

    const reminderCountColumnId =
      normalizeEnv(process.env.MONDAY_REMINDER_COUNT_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/nombre.*relance/i, /relances.*envoyees/i, /nb.*relances/i])?.id;

    const reminderCountValue = findItemColumnValue(item.column_values, reminderCountColumnId)?.text;
    const currentReminderCount = parseReminderCount(reminderCountValue);
    if (currentReminderCount >= DEPOT_REMINDER_DAY_OFFSETS.length) {
      continue;
    }

    const dayOffset = DEPOT_REMINDER_DAY_OFFSETS[currentReminderCount];
    const dueAt = addDays(new Date(session.created_at), dayOffset);
    if (dueAt > now) {
      continue;
    }

    due.push({
      session,
      dayOffset,
      currentReminderCount
    });
  }

  return due;
};

const updateMondayReminderTracking = async ({
  mondayItemId,
  sentCount,
  sentAt,
  isPerDossier
}: {
  mondayItemId: string;
  sentCount: number;
  sentAt: string;
  isPerDossier?: boolean;
}) => {
  if (!normalizeEnv(process.env.MONDAY_API_TOKEN) || !mondayItemId) {
    return false;
  }

  const item = await getItemById(mondayItemId);
  if (!item) return false;

  const boardColumns = await getBoardColumns(item.board.id);
  const lastReminderDateColumnId =
    (isPerDossier ? normalizeEnv(process.env.MONDAY_PER_LAST_REMINDER_DATE_COLUMN_ID) : undefined) ??
    normalizeEnv(process.env.MONDAY_LAST_REMINDER_DATE_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/date.*derniere.*relance/i, /derniere.*relance/i])?.id;
  const reminderCountColumnId =
    (isPerDossier ? normalizeEnv(process.env.MONDAY_PER_REMINDER_COUNT_COLUMN_ID) : undefined) ??
    normalizeEnv(process.env.MONDAY_REMINDER_COUNT_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/nombre.*relance/i, /relances.*envoyees/i, /nb.*relances/i])?.id;

  if (!lastReminderDateColumnId && !reminderCountColumnId) {
    return false;
  }

  const columnValues: Record<string, unknown> = {};
  if (lastReminderDateColumnId) {
    columnValues[lastReminderDateColumnId] = { date: sentAt.slice(0, 10) };
  }
  if (reminderCountColumnId) {
    columnValues[reminderCountColumnId] = String(sentCount);
  }

  await updateItemMultipleColumns({
    boardId: item.board.id,
    itemId: mondayItemId,
    columnValues
  });

  return true;
};

const createTransporter = () => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = parsePort(normalizeEnv(process.env.SMTP_PORT), 465);
  const secure = normalizeEnv(process.env.SMTP_SECURE) !== "false";
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return {
    from,
    transporter
  };
};

const runReminderBatch = async () => {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: "Configuration Supabase manquante" }, { status: 500 });
  }

  const transporterConfig = createTransporter();
  if (!transporterConfig) {
    return NextResponse.json({ ok: false, error: "Configuration SMTP manquante" }, { status: 500 });
  }

  const maxAttempts = parsePositiveInt(normalizeEnv(process.env.DEPOT_REMINDER_MAX_ATTEMPTS), 4, 10);
  const batchSize = parsePositiveInt(normalizeEnv(process.env.DEPOT_REMINDER_BATCH_SIZE), 80, 300);
  const siteBaseUrl = getSiteBaseUrl();
  const instagramUrl = normalizeEnv(process.env.GP_INSTAGRAM_URL) ?? "https://www.instagram.com/gabriel_perbost/";
  const linkedinUrl = normalizeEnv(process.env.GP_LINKEDIN_URL) ?? "https://www.linkedin.com/in/gabriel-perbost/";
  const { dayKey, startIso, endIso } = getUtcDayWindow();

  let mode: "table" | "fallback" = "table";
  let dueReminders: Awaited<ReturnType<typeof getDueSessionReminders>> = [];
  let fallbackDueReminders: FallbackDueReminder[] = [];

  try {
    dueReminders = await getDueSessionReminders({
      maxAttempts,
      limit: batchSize
    });
  } catch (error) {
    if (!isMissingSessionRemindersTableError(error)) {
      throw error;
    }
    if (!isReminderFallbackEnabled()) {
      console.warn("depot-reminders-fallback-disabled", {
        reason: error instanceof Error ? error.message : "unknown_error"
      });
      return NextResponse.json(
        {
          ok: true,
          mode: "disabled_no_table",
          due_found: 0,
          sent_count: 0,
          skipped_count: 0,
          failed_count: 0
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
    mode = "fallback";
    fallbackDueReminders = await getDueFallbackReminders({ limit: batchSize });
    console.warn("depot-reminders-fallback-enabled", {
      reason: error instanceof Error ? error.message : "unknown_error"
    });
  }

  const dueCount = mode === "table" ? dueReminders.length : fallbackDueReminders.length;
  if (!dueCount) {
    return NextResponse.json(
      {
        ok: true,
        mode,
        due_found: 0,
        sent_count: 0,
        skipped_count: 0,
        failed_count: 0
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  let savingsValue: number | null = null;
  try {
    const counter = await getSavingsCounter();
    savingsValue = counter.value;
  } catch (counterErr) {
    console.error("depot-reminders-counter-read-failed", counterErr);
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let mondayUpdatedCount = 0;
  let dailyDuplicateSkippedCount = 0;
  const errors: Array<{ reminder_id: string; error: string }> = [];
  const remindedTodayEmailKeys = new Set<string>();

  if (mode === "table") {
    try {
      const existingKeys = await getAlreadyRemindedTodayEmailKeys({
        startIso,
        endIso,
        dayKey
      });
      for (const key of existingKeys) {
        remindedTodayEmailKeys.add(key);
      }
    } catch (alreadySentErr) {
      console.error("depot-reminders-already-sent-read-failed", alreadySentErr);
    }
  }

  if (mode === "table") {
    for (const reminder of dueReminders) {
      try {
        const session = await getReminderSession(reminder.session_id);

        if (session.status !== "pending" && session.status !== "password_set") {
          await markReminderAsSkipped({
            reminderId: reminder.id,
            reason: `session_status_${session.status}`
          });
          skippedCount += 1;
          continue;
        }

        if (new Date(session.token_expires_at) < new Date()) {
          await markReminderAsSkipped({
            reminderId: reminder.id,
            reason: "token_expired"
          });
          skippedCount += 1;
          continue;
        }

        const clientEmail = session.client_email?.trim();
        if (!clientEmail || !clientEmail.includes("@")) {
          await markReminderAsSkipped({
            reminderId: reminder.id,
            reason: "invalid_client_email"
          });
          skippedCount += 1;
          continue;
        }

        const dailyEmailKey = buildDailyEmailKey(clientEmail, dayKey);
        if (remindedTodayEmailKeys.has(dailyEmailKey)) {
          await markReminderAsSkipped({
            reminderId: reminder.id,
            reason: "email_already_reminded_today"
          });
          skippedCount += 1;
          dailyDuplicateSkippedCount += 1;
          continue;
        }

        const isPerDossier = isPerSessionBank(session.bank);
        const link = buildClientAccessLink({
          token: session.token,
          requestUrl: siteBaseUrl,
          email: session.client_email,
          accessPath: isPerDossier ? PER_DOSSIER_ACCESS_PATH : "/depot"
        });
        const reminderEmail = isPerDossier
          ? buildPerDossierReminderEmail({
              dayOffset: reminder.day_offset,
              clientName: session.client_name || "Client",
              link,
              expiresAt: session.token_expires_at,
              siteBaseUrl
            })
          : buildDepotReminderEmail({
              dayOffset: reminder.day_offset,
              clientName: session.client_name || "Client",
              link,
              expiresAt: session.token_expires_at,
              siteBaseUrl,
              savingsValue,
              instagramUrl,
              linkedinUrl
            });

        const info = await transporterConfig.transporter.sendMail({
          from: transporterConfig.from,
          to: clientEmail,
          subject: reminderEmail.subject,
          html: reminderEmail.html
        });

        const sentAt = new Date().toISOString();
        await markReminderAsSent({
          reminderId: reminder.id,
          attemptCount: reminder.attempt_count,
          messageId: info.messageId
        });
        remindedTodayEmailKeys.add(dailyEmailKey);
        sentCount += 1;

        try {
          const totalSentForSession = await countSentRemindersForSession(session.id);
          const mondayUpdated = await updateMondayReminderTracking({
            mondayItemId: session.monday_item_id,
            sentCount: totalSentForSession,
            sentAt,
            isPerDossier
          });
          if (mondayUpdated) {
            mondayUpdatedCount += 1;
          }
        } catch (mondayErr) {
          console.error("depot-reminders-monday-tracking-update-failed", {
            monday_item_id: session.monday_item_id,
            mondayErr
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown_error";
        failedCount += 1;

        try {
          await markReminderAsFailed({
            reminderId: reminder.id,
            attemptCount: reminder.attempt_count,
            errorMessage: message
          });
        } catch (markErr) {
          console.error("depot-reminders-mark-failed-error", {
            reminder_id: reminder.id,
            markErr
          });
        }

        errors.push({
          reminder_id: reminder.id,
          error: message.slice(0, 240)
        });
        console.error("depot-reminder-send-failed", {
          reminder_id: reminder.id,
          monday_item_id: reminder.monday_item_id,
          error: message
        });
      }
    }
  } else {
    for (const reminder of fallbackDueReminders) {
      try {
        const session = reminder.session;
        const clientEmail = session.client_email?.trim();
        if (!clientEmail || !clientEmail.includes("@")) {
          skippedCount += 1;
          continue;
        }
        if (new Date(session.token_expires_at) < new Date()) {
          skippedCount += 1;
          continue;
        }

        const dailyEmailKey = buildDailyEmailKey(clientEmail, dayKey);
        if (remindedTodayEmailKeys.has(dailyEmailKey)) {
          skippedCount += 1;
          dailyDuplicateSkippedCount += 1;
          continue;
        }

        const isPerDossier = isPerSessionBank(session.bank);
        const link = buildClientAccessLink({
          token: session.token,
          requestUrl: siteBaseUrl,
          email: session.client_email,
          accessPath: isPerDossier ? PER_DOSSIER_ACCESS_PATH : "/depot"
        });
        const reminderEmail = isPerDossier
          ? buildPerDossierReminderEmail({
              dayOffset: reminder.dayOffset,
              clientName: session.client_name || "Client",
              link,
              expiresAt: session.token_expires_at,
              siteBaseUrl
            })
          : buildDepotReminderEmail({
              dayOffset: reminder.dayOffset,
              clientName: session.client_name || "Client",
              link,
              expiresAt: session.token_expires_at,
              siteBaseUrl,
              savingsValue,
              instagramUrl,
              linkedinUrl
            });

        await transporterConfig.transporter.sendMail({
          from: transporterConfig.from,
          to: clientEmail,
          subject: reminderEmail.subject,
          html: reminderEmail.html
        });
        remindedTodayEmailKeys.add(dailyEmailKey);
        sentCount += 1;

        const mondayUpdated = await updateMondayReminderTracking({
          mondayItemId: session.monday_item_id,
          sentCount: reminder.currentReminderCount + 1,
          sentAt: new Date().toISOString(),
          isPerDossier
        });
        if (mondayUpdated) {
          mondayUpdatedCount += 1;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown_error";
        failedCount += 1;
        errors.push({
          reminder_id: `fallback:${reminder.session.id}:${reminder.dayOffset}`,
          error: message.slice(0, 240)
        });
        console.error("depot-reminder-send-failed-fallback", {
          session_id: reminder.session.id,
          monday_item_id: reminder.session.monday_item_id,
          day_offset: reminder.dayOffset,
          error: message
        });
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      mode,
      due_found: dueCount,
      sent_count: sentCount,
      skipped_count: skippedCount,
      daily_duplicate_skipped_count: dailyDuplicateSkippedCount,
      failed_count: failedCount,
      monday_tracking_updated_count: mondayUpdatedCount,
      errors
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    return await runReminderBatch();
  } catch (err) {
    console.error("depot-reminders-cron-failed", err);
    return NextResponse.json({ ok: false, error: "depot_reminders_cron_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    return await runReminderBatch();
  } catch (err) {
    console.error("depot-reminders-cron-failed", err);
    return NextResponse.json({ ok: false, error: "depot_reminders_cron_failed" }, { status: 500 });
  }
}
