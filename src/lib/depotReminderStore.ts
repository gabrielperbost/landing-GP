import { DEPOT_REMINDER_DAY_OFFSETS, type DepotReminderDayOffset } from "@/lib/depotReminderEmailTemplates";
import { supabaseAdmin } from "@/lib/supabase";

export type SessionReminderStatus = "pending" | "sent" | "failed" | "skipped";

export type SessionReminderRow = {
  id: string;
  session_id: string;
  monday_item_id: string;
  day_offset: number;
  due_at: string;
  status: SessionReminderStatus;
  attempt_count: number;
  sent_at: string | null;
  last_attempt_at: string | null;
  smtp_message_id: string | null;
  error_message: string | null;
};

export type SessionReminderSession = {
  id: string;
  token: string;
  monday_item_id: string;
  client_name: string;
  client_email: string;
  bank: string | null;
  status: string;
  token_expires_at: string;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const normalizeReminderDayOffset = (value: number): DepotReminderDayOffset | null =>
  DEPOT_REMINDER_DAY_OFFSETS.includes(value as DepotReminderDayOffset) ? (value as DepotReminderDayOffset) : null;

const isMissingSessionRemindersTableError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("session_reminders") && (normalized.includes("schema cache") || normalized.includes("does not exist"));
};

export const scheduleSessionReminders = async ({
  sessionId,
  mondayItemId,
  baseDate = new Date()
}: {
  sessionId: string;
  mondayItemId: string;
  baseDate?: Date;
}) => {
  const rows = DEPOT_REMINDER_DAY_OFFSETS.map((dayOffset) => ({
    session_id: sessionId,
    monday_item_id: mondayItemId,
    day_offset: dayOffset,
    due_at: addDays(baseDate, dayOffset).toISOString()
  }));

  const { error } = await supabaseAdmin.from("session_reminders").upsert(rows, {
    onConflict: "session_id,day_offset",
    ignoreDuplicates: true
  });

  if (error) {
    // La table peut ne pas exister sur certains environnements; on continue sans bloquer le flux client.
    if (isMissingSessionRemindersTableError(error.message)) {
      return false;
    }
    throw new Error(`schedule_session_reminders_failed:${error.message}`);
  }

  return true;
};

export const getDueSessionReminders = async ({
  maxAttempts,
  limit
}: {
  maxAttempts: number;
  limit: number;
}) => {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("session_reminders")
    .select("id,session_id,monday_item_id,day_offset,due_at,status,attempt_count,sent_at,last_attempt_at,smtp_message_id,error_message")
    .lte("due_at", nowIso)
    .in("status", ["pending", "failed"])
    .lt("attempt_count", maxAttempts)
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`get_due_session_reminders_failed:${error.message}`);
  }

  const reminders = (data ?? []) as SessionReminderRow[];

  return reminders
    .map((row) => {
      const normalizedDayOffset = normalizeReminderDayOffset(Number(row.day_offset));
      if (!normalizedDayOffset) return null;
      return {
        ...row,
        day_offset: normalizedDayOffset
      };
    })
    .filter(Boolean) as Array<SessionReminderRow & { day_offset: DepotReminderDayOffset }>;
};

export const getReminderSession = async (sessionId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id,token,monday_item_id,client_name,client_email,bank,status,token_expires_at")
    .eq("id", sessionId)
    .single();

  if (error) {
    throw new Error(`get_reminder_session_failed:${error.message}`);
  }

  return data as SessionReminderSession;
};

export const countSentRemindersForSession = async (sessionId: string) => {
  const { count, error } = await supabaseAdmin
    .from("session_reminders")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "sent");

  if (error) {
    throw new Error(`count_sent_reminders_failed:${error.message}`);
  }

  return count ?? 0;
};

export const markReminderAsSent = async ({
  reminderId,
  attemptCount,
  messageId
}: {
  reminderId: string;
  attemptCount: number;
  messageId?: string;
}) => {
  const nowIso = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("session_reminders")
    .update({
      status: "sent",
      sent_at: nowIso,
      last_attempt_at: nowIso,
      attempt_count: attemptCount + 1,
      smtp_message_id: messageId ?? null,
      error_message: null
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error(`mark_reminder_sent_failed:${error.message}`);
  }
};

export const markReminderAsFailed = async ({
  reminderId,
  attemptCount,
  errorMessage
}: {
  reminderId: string;
  attemptCount: number;
  errorMessage: string;
}) => {
  const nowIso = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("session_reminders")
    .update({
      status: "failed",
      last_attempt_at: nowIso,
      attempt_count: attemptCount + 1,
      error_message: errorMessage.slice(0, 500)
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error(`mark_reminder_failed_failed:${error.message}`);
  }
};

export const markReminderAsSkipped = async ({
  reminderId,
  reason
}: {
  reminderId: string;
  reason: string;
}) => {
  const nowIso = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("session_reminders")
    .update({
      status: "skipped",
      last_attempt_at: nowIso,
      error_message: reason.slice(0, 500)
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error(`mark_reminder_skipped_failed:${error.message}`);
  }
};
