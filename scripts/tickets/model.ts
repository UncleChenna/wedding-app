import { z } from "zod";

/**
 * Ticket model: the single source of truth for statuses, fields and allowed
 * transitions. `docs/tickets.md` documents the same rules for humans.
 */

export const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled",
] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses that may move to `blocked` (and that `blocked` may return to). */
export const ACTIVE_STATUSES = ["todo", "in_progress", "in_review"] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

/** Every legal move. `blocked` → previous status is checked against `resume_to`. */
export const TRANSITIONS: Record<Status, readonly Status[]> = {
  backlog: ["todo", "cancelled"],
  todo: ["in_progress", "blocked", "cancelled"],
  in_progress: ["in_review", "blocked", "cancelled"],
  in_review: ["done", "in_progress", "blocked", "cancelled"],
  blocked: ["todo", "in_progress", "in_review", "cancelled"],
  done: [],
  cancelled: [],
};

export const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ESTIMATES = ["S", "M", "L"] as const;
export type Estimate = (typeof ESTIMATES)[number];
/** Relative size used for critical paths. L is the maximum: about half a day of agent work. */
export const ESTIMATE_POINTS: Record<Estimate, number> = { S: 1, M: 2, L: 4 };
export const ESTIMATE_HOURS: Record<Estimate, number> = { S: 1, M: 2, L: 4 };

export const LABELS = [
  "frontend",
  "backend",
  "db",
  "pwa",
  "infra",
  "test",
  "design",
  "docs",
  "security",
  "human",
] as const;

export const MODULES = [
  "invitations",
  "checkin",
  "ordering",
  "admin",
  "theming",
  "shared",
  "harness",
  "ops",
] as const;

/** Epics in delivery order. Keys are stable; titles and goals render in BOARD.md and ROADMAP.md. */
export const EPICS = [
  {
    key: "foundations",
    title: "Foundations fix-ups",
    goal: "Repair and finish what the bootstrap left broken or unverified.",
  },
  {
    key: "design-system",
    title: "Design system and theming",
    goal: "Tokens, preset themes, base components, motion and contrast gates.",
  },
  {
    key: "data-auth",
    title: "Data and auth",
    goal: "PRD-shaped schema, RLS, admin auth with 2FA, staff PINs and seed data.",
  },
  {
    key: "invitations",
    title: "Invitations and RSVP",
    goal: "The personal IV, envelope reveal, RSVP with tag-alongs and the QR pass.",
  },
  {
    key: "sharing",
    title: "Sharing",
    goal: "Share menu, sent tracking and reminder re-shares without paid providers.",
  },
  {
    key: "checkin",
    title: "Gate check-in",
    goal: "Fast, offline-first scanning with signed QR tokens and partial admission.",
  },
  {
    key: "ordering",
    title: "Table ordering",
    goal: "Menu, order page, kitchen and bar boards with live status and limits.",
  },
  {
    key: "alerts",
    title: "Order alerts",
    goal: "Batched WhatsApp alerts to station leads with a safe fallback.",
  },
  {
    key: "admin",
    title: "Admin dashboard",
    goal: "Guest list, seating, menu, themes, staff and live counters.",
  },
  {
    key: "pwa",
    title: "PWA",
    goal: "Installable app with offline pass, offline scanner and update prompts.",
  },
  {
    key: "quality",
    title: "Accessibility, performance and SEO",
    goal: "WCAG AA, Lighthouse 95+ and correct metadata on guest pages.",
  },
  {
    key: "security",
    title: "Security and privacy",
    goal: "Rate limits, headers, secrets, UK GDPR notice and data retention.",
  },
  {
    key: "testing",
    title: "Testing",
    goal: "Critical-logic coverage, journey e2e, visual regression and load tests.",
  },
  {
    key: "observability",
    title: "Observability",
    goal: "Error tracking, structured logs, uptime checks and a health page.",
  },
  {
    key: "deployment",
    title: "Deployment",
    goal: "Production Supabase and Vercel, previews, migrations, backups, rollback.",
  },
  {
    key: "launch",
    title: "Launch and the day itself",
    goal: "Real data, rehearsal, runbook, the day, and the post-wedding wind-down.",
  },
] as const;
export type EpicKey = (typeof EPICS)[number]["key"];
export const EPIC_KEYS = EPICS.map((e) => e.key) as [EpicKey, ...EpicKey[]];

/** Milestones that ROADMAP.md computes a critical path to. Ids must exist. */
export const MILESTONES = [
  { id: "WED-154", name: "Deployed and installable as a PWA" },
  { id: "WED-164", name: "Wedding day ready (code freeze, go/no-go)" },
] as const;

/** Required body sections, in order. */
export const SECTIONS = [
  "Context",
  "Scope",
  "Out of scope",
  "Acceptance criteria",
  "Test plan",
  "Files likely touched",
  "Notes / decisions",
  "Activity log",
] as const;
export type SectionName = (typeof SECTIONS)[number];

export const ID_PATTERN = /^WED-\d{3}$/;
const ticketId = z.string().regex(ID_PATTERN, "ids look like WED-001");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dates are YYYY-MM-DD");
const optionalDate = z.union([z.literal(""), date]);

export const frontmatterSchema = z
  .object({
    id: ticketId,
    title: z
      .string()
      .min(5)
      .max(69, "titles are under 70 characters")
      .refine((t) => /^[A-Z]/.test(t), "titles start with a capital (imperative verb)")
      .refine((t) => !/[.!?]$/.test(t), "titles have no trailing punctuation"),
    epic: z.enum(EPIC_KEYS),
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    estimate: z.enum(ESTIMATES),
    labels: z.array(z.enum(LABELS)).min(1, "at least one label"),
    module: z.enum(MODULES),
    owner: z.string(),
    agent: z.string(),
    blocked_by: z.array(ticketId),
    blocks: z.array(ticketId),
    branch: z.string(),
    pr: z.union([z.literal(""), z.url()]),
    created: date,
    updated: date,
    started: optionalDate,
    completed: optionalDate,
    /** Why the ticket is blocked or cancelled. */
    reason: z.string(),
    /** The status a blocked ticket returns to. */
    resume_to: z.union([z.literal(""), z.enum(ACTIVE_STATUSES)]),
  })
  .strict();

export type Frontmatter = z.infer<typeof frontmatterSchema>;
export const FIELD_ORDER = Object.keys(frontmatterSchema.shape) as (keyof Frontmatter)[];

export interface Ticket {
  meta: Frontmatter;
  sections: Record<SectionName, string>;
  /** Repository-relative path, e.g. tickets/WED-001-fix-hooks.md */
  path: string;
}

/** Live state shared through the coordination ledger. */
export const LEDGER_FIELDS = [
  "status",
  "owner",
  "agent",
  "branch",
  "pr",
  "started",
  "completed",
  "updated",
  "reason",
  "resume_to",
] as const satisfies readonly (keyof Frontmatter)[];
export type LedgerFields = Pick<Frontmatter, (typeof LEDGER_FIELDS)[number]>;
export interface LedgerRecord extends LedgerFields {
  /** Activity log lines appended by CLI moves, oldest first. */
  log: string[];
}
export interface LedgerData {
  version: 1;
  /** Highest ticket number ever allocated, so ids are never reused across branches. */
  lastId: number;
  tickets: Record<string, LedgerRecord>;
}

export function idNumber(id: string): number {
  return Number(id.slice(4));
}
export function formatId(n: number): string {
  return `WED-${String(n).padStart(3, "0")}`;
}
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48)
      .replace(/-$/, "") || "ticket"
  );
}
