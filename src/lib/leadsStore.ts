import { promises as fs } from "fs";
import path from "path";

export type LeadLogStatus = "sent" | "mocked" | "error";

export type LeadLogEntry = {
  submittedAt: string;
  fullName: string;
  phone: string;
  email: string;
  source: string;
  status: LeadLogStatus;
  detail: string;
};

const RUNTIME_DATA_DIR = process.env.VERCEL ? path.join("/tmp", "gp-finances-data") : path.join(process.cwd(), "data");
const LEADS_CSV_PATH = path.join(RUNTIME_DATA_DIR, "leads.csv");
const SEED_LEADS_CSV_PATH = path.join(process.cwd(), "data", "leads.csv");
const HEADER = ["submitted_at", "full_name", "phone", "email", "source", "status", "detail"].join(",");

let writeQueue: Promise<unknown> = Promise.resolve();

const withFileLock = async <T>(task: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const escapeCsv = (value: string) => {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
};

const toRow = (entry: LeadLogEntry) =>
  [
    entry.submittedAt,
    entry.fullName,
    entry.phone,
    entry.email,
    entry.source,
    entry.status,
    entry.detail
  ]
    .map((value) => escapeCsv(value))
    .join(",") + "\n";

const ensureLeadsFile = async () => {
  await fs.mkdir(path.dirname(LEADS_CSV_PATH), { recursive: true });
  try {
    await fs.access(LEADS_CSV_PATH);
    return;
  } catch {
    // Ignore and continue to initialize from seed/default.
  }

  if (LEADS_CSV_PATH !== SEED_LEADS_CSV_PATH) {
    try {
      await fs.copyFile(SEED_LEADS_CSV_PATH, LEADS_CSV_PATH);
      return;
    } catch {
      // Seed file may not exist in some environments.
    }
  }

  await fs.writeFile(LEADS_CSV_PATH, `${HEADER}\n`, "utf8");
};

export const appendLeadLog = async (entry: LeadLogEntry): Promise<void> =>
  withFileLock(async () => {
    await ensureLeadsFile();
    await fs.appendFile(LEADS_CSV_PATH, toRow(entry), "utf8");
  });

export const getLeadsCsv = async (): Promise<string> => {
  await ensureLeadsFile();
  return fs.readFile(LEADS_CSV_PATH, "utf8");
};
