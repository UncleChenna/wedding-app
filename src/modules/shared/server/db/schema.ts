import { randomBytes } from "node:crypto";

import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  time,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema (single source of truth). Change it here, then run
 * `pnpm db:generate` to create a migration. Never edit applied migrations.
 *
 * Every table has row-level security enabled with no policies: the browser
 * (Supabase anon/publishable key) cannot read or write anything directly.
 * Server code connects with DATABASE_URL and is the only data path until a
 * feature adds explicit policies.
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

const photoBytes = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** Bounded private invitation assets; original uploads and filenames are never stored. */
export const invitationPhotos = pgTable(
  "invitation_photos",
  {
    slot: integer("slot").primaryKey(),
    id: uuid("id").notNull().defaultRandom().unique(),
    bytes: photoBytes("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    blurDataUrl: text("blur_data_url").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("invitation_photos_slot", sql`${t.slot} between 1 and 16`),
    check("invitation_photos_size", sql`octet_length(${t.bytes}) between 1 and 4194304`),
    check(
      "invitation_photos_dimensions",
      sql`${t.width} between 1 and 2560 and ${t.height} between 1 and 2560`,
    ),
    check(
      "invitation_photos_blur",
      sql`length(${t.blurDataUrl}) between 24 and 10947 and left(${t.blurDataUrl}, 23) = 'data:image/webp' || chr(59) || 'base64,'`,
    ),
  ],
).enableRLS();

/** Ephemeral keyed network counters; no credentials or raw addresses are stored. */
export const requestBudgets = pgTable(
  "request_budgets",
  {
    scope: text("scope").notNull(),
    identity: text("identity").notNull(),
    used: integer("used").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.identity] }),
    index("request_budgets_expiry_idx").on(t.expiresAt),
    check("request_budgets_scope", sql`${t.scope} in ('lookup', 'pin')`),
    check("request_budgets_identity", sql`${t.identity} ~ '^[0-9a-f]{64}$'`),
    check("request_budgets_used", sql`${t.used} between 0 and 100000`),
  ],
).enableRLS();

// ─── Enums ────────────────────────────────────────────────────────────────

export const staffRole = pgEnum("staff_role", ["admin", "gate", "kitchen", "bar"]);
export const invitationStatus = pgEnum("invitation_status", [
  "draft",
  "sent",
  "rsvp_yes",
  "rsvp_no",
  "revoked",
]);
export const legacyMenuCategory = pgEnum("menu_category", ["food", "drink"]);
export const menuCategory = pgEnum("menu_category_v2", ["meal", "soft_drink", "alcohol"]);
export const stationOrderStatus = pgEnum("station_order_status", [
  "received",
  "preparing",
  "served",
  "cancelled",
]);
export const station = pgEnum("station", ["kitchen", "bar"]);
export const scanResult = pgEnum("scan_result", [
  "valid",
  "already_used",
  "invalid",
  "revoked",
  "not_rsvped",
]);
export const orderAlertStatus = pgEnum("order_alert_status", ["pending", "sent", "failed"]);
export const orderStatus = pgEnum("order_status", [
  "received",
  "preparing",
  "ready",
  "served",
  "cancelled",
]);

// ─── Theming ──────────────────────────────────────────────────────────────

/** Themes stored in the DB (future admin theme picker). JSON files remain the default source. */
export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tokens: jsonb("tokens").notNull(),
  /** Immutable to draft saves; replaced only by an explicit atomic publication. */
  publishedTokens: jsonb("published_tokens"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

// ─── Staff ────────────────────────────────────────────────────────────────

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Supabase Auth is for admins; PIN-only staff do not need an email account. */
    authUserId: uuid("auth_user_id").unique(),
    name: text("name").notNull(),
    email: text("email").unique(),
    role: staffRole("role").notNull(),
    /** Encoded scrypt parameters, salt and digest. Never a raw PIN. */
    pinHash: text("pin_hash"),
    pinIssuedAt: timestamp("pin_issued_at", { withTimezone: true }),
    pinExpiresAt: timestamp("pin_expires_at", { withTimezone: true }),
    credentialVersion: integer("credential_version").notNull().default(1),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("staff_credential_version_positive", sql`${t.credentialVersion} > 0`),
    check(
      "staff_pin_credential_complete",
      sql`
      (${t.pinHash} is null and ${t.pinIssuedAt} is null and ${t.pinExpiresAt} is null)
      or
      (${t.pinHash} is not null and ${t.pinIssuedAt} is not null and ${t.pinExpiresAt} is not null
       and ${t.pinExpiresAt} > ${t.pinIssuedAt} and ${t.role} <> 'admin'
       and ${t.pinHash} ~ '^scrypt[$][1-9][0-9]{0,6}[$][1-9][0-9]{0,3}[$][1-9][0-9]{0,3}[$][0-9a-f]{32,128}[$]([0-9a-f]{2}){32,128}$')
    `,
    ),
  ],
).enableRLS();

/** Stable IDs survive renaming and revocation. Legacy text IDs remain representable. */
export const registeredDevices = pgTable(
  "registered_devices",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: text("name").notNull(),
    role: staffRole("role").notNull(),
    registeredByStaffId: uuid("registered_by_staff_id").references(() => staff.id, {
      onDelete: "restrict",
    }),
    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("registered_devices_id_format", sql`${t.id} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'`),
    check("registered_devices_name_length", sql`char_length(trim(${t.name})) between 1 and 120`),
    check("registered_devices_staff_role", sql`${t.role} in ('gate', 'kitchen', 'bar')`),
  ],
).enableRLS();

/** Anonymous device attempts persist across app instances; no PIN or guest data. */
export const staffPinAttempts = pgTable(
  "staff_pin_attempts",
  {
    deviceId: text("device_id").primaryKey(),
    failures: integer("failures").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    check("staff_pin_attempts_device_format", sql`${t.deviceId} ~ '^[0-9a-f]{64}$'`),
    check("staff_pin_attempts_failures_range", sql`${t.failures} between 0 and 5`),
    index("staff_pin_attempts_window_idx").on(t.windowStartedAt),
  ],
).enableRLS();

// ─── Invitations ──────────────────────────────────────────────────────────

/** One invitation is the unit of RSVP and gate admission. */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Application inserts use 256 random bits; raw SQL must supply its own secure token.
    token: text("token")
      .notNull()
      .unique()
      .$defaultFn(() => randomBytes(32).toString("base64url")),
    householdName: text("household_name"),
    maxTagAlongs: integer("max_tag_alongs").notNull().default(1),
    status: invitationStatus("status").notNull().default("draft"),
    tokenVersion: integer("token_version").notNull().default(1),
    tableId: uuid("table_id").references(() => tables.id, { onDelete: "set null" }),
    side: text("side"),
    notes: text("notes"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("invitations_tag_along_capacity", sql`${t.maxTagAlongs} between 0 and 10`),
    check("invitations_token_format", sql`${t.token} ~ '^[A-Za-z0-9_-]{22,}$'`),
    check("invitations_token_version_positive", sql`${t.tokenVersion} > 0`),
    index("invitations_table_id_idx").on(t.tableId),
  ],
).enableRLS();

export const tables = pgTable(
  "tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").notNull().unique(),
    name: text("name"),
    capacity: integer("capacity").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("tables_capacity_positive", sql`${t.capacity} > 0`)],
).enableRLS();

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    /** The named invitee (false for tag-alongs added by the household). */
    isPrimary: boolean("is_primary").notNull().default(false),
    mealChoice: text("meal_choice"),
    dietaryNotes: text("dietary_notes"),
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("guests_name_not_blank", sql`length(trim(${t.name})) > 0`),
    check("guests_phone_e164", sql`${t.phone} is null or ${t.phone} ~ '^\\+[1-9][0-9]{1,14}$'`),
    index("guests_invitation_id_idx").on(t.invitationId),
    index("guests_table_id_idx").on(t.tableId),
  ],
).enableRLS();

/** One RSVP per invitation. */
export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .unique()
      .references(() => invitations.id, { onDelete: "cascade" }),
    attending: boolean("attending").notNull(),
    countAttending: integer("count_attending").notNull(),
    message: text("message"),
    respondedAt: timestamp("responded_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      "rsvps_attendance_count",
      sql`(${t.attending} and ${t.countAttending} > 0) or (not ${t.attending} and ${t.countAttending} = 0)`,
    ),
  ],
).enableRLS();

// ─── Gate check-in ────────────────────────────────────────────────────────

/** Canonical admissions; cross-table guards must enforce the current RSVP allowance. */
export const admissionCounters = pgTable(
  "admission_counters",
  {
    invitationId: uuid("invitation_id")
      .primaryKey()
      .references(() => invitations.id, { onDelete: "restrict" }),
    allowance: integer("allowance").notNull(),
    admittedPeople: integer("admitted_people").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("admission_counters_allowance_nonnegative", sql`${t.allowance} >= 0`),
    check(
      "admission_counters_bounded",
      sql`${t.admittedPeople} >= 0 and ${t.admittedPeople} <= ${t.allowance}`,
    ),
  ],
).enableRLS();

/** Preserve physical reports separately from canonical allocation; never store a PIN or QR. */
export const scanEvents = pgTable(
  "scan_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientEventId: uuid("client_event_id").notNull(),
    invitationId: uuid("invitation_id").references(() => invitations.id, { onDelete: "restrict" }),
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "restrict" }),
    deviceId: text("device_id").references(() => registeredDevices.id, { onDelete: "restrict" }),
    reportedAt: timestamp("reported_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    reportedResult: scanResult("reported_result").notNull(),
    result: scanResult("result").notNull(),
    reportedPeople: integer("reported_people").notNull(),
    admittedPeople: integer("admitted_people").notNull(),
    conflict: boolean("conflict").notNull().default(false),
    source: text("source").notNull(),
    legacyCheckInId: uuid("legacy_check_in_id").references(() => checkIns.id, {
      onDelete: "restrict",
    }),
  },
  (t) => [
    uniqueIndex("scan_events_client_event_id_key").on(t.clientEventId),
    uniqueIndex("scan_events_legacy_check_in_id_key").on(t.legacyCheckInId),
    index("scan_events_invitation_received_idx").on(t.invitationId, t.receivedAt),
    index("scan_events_device_received_idx").on(t.deviceId, t.receivedAt),
    index("scan_events_staff_received_idx").on(t.staffId, t.receivedAt),
    check("scan_events_source", sql`${t.source} in ('online', 'offline', 'legacy')`),
    check(
      "scan_events_counts",
      sql`${t.reportedPeople} >= 0 and ${t.admittedPeople} >= 0 and ${t.admittedPeople} <= ${t.reportedPeople}`,
    ),
    check(
      "scan_events_canonical_admission",
      sql`${t.admittedPeople} = 0 or (${t.result} = 'valid' and ${t.invitationId} is not null)`,
    ),
    check(
      "scan_events_reported_admission",
      sql`${t.reportedPeople} = 0 or ${t.reportedResult} = 'valid'`,
    ),
    check(
      "scan_events_unallocated_report_conflict",
      sql`${t.reportedPeople} = ${t.admittedPeople} or ${t.conflict}`,
    ),
    check(
      "scan_events_live_identity",
      sql`${t.source} = 'legacy' or (${t.staffId} is not null and ${t.deviceId} is not null)`,
    ),
    check(
      "scan_events_legacy_identity",
      sql`(${t.source} = 'legacy') = (${t.legacyCheckInId} is not null)`,
    ),
  ],
).enableRLS();

/** Historical guest-level archive, retained unchanged during invitation-level migration. */
export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    /** When the scan happened on the device (may be earlier than sync time when offline). */
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull(),
    deviceId: text("device_id"),
    /** Idempotency key generated on the device, so offline scans can be retried safely. */
    clientEventId: uuid("client_event_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("check_ins_guest_id_key").on(t.guestId),
    uniqueIndex("check_ins_client_event_id_key").on(t.clientEventId),
  ],
).enableRLS();

// ─── Table ordering ───────────────────────────────────────────────────────

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    /** Archived classification retained for pre-migration records. */
    legacyCategory: legacyMenuCategory("category"),
    category: menuCategory("category_v2").notNull(),
    maxPerOrder: integer("max_per_order").notNull().default(5),
    station: station("station").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    dietaryTags: text("dietary_tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("menu_items_quantity_cap", sql`${t.maxPerOrder} between 1 and 100`)],
).enableRLS();

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientRequestId: uuid("client_request_id").notNull().defaultRandom().unique(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "restrict" }),
    guestName: text("guest_name"),
    status: orderStatus("status").notNull().default("received"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_status_created_at_idx").on(t.status, t.createdAt)],
).enableRLS();

/** One kitchen/bar projection per guest submission; table limits count orders, not these rows. */
export const stationOrders = pgTable(
  "station_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    station: station("station").notNull(),
    status: stationOrderStatus("status").notNull().default("received"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("station_orders_order_station_key").on(t.orderId, t.station),
    uniqueIndex("station_orders_order_id_id_key").on(t.orderId, t.id),
    index("station_orders_queue_idx").on(t.station, t.status, t.createdAt),
  ],
).enableRLS();

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    stationOrderId: uuid("station_order_id").notNull(),
    quantityLimit: integer("quantity_limit").notNull().default(5),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    uniqueIndex("order_items_order_menu_key").on(t.orderId, t.menuItemId),
    foreignKey({
      columns: [t.orderId, t.stationOrderId],
      foreignColumns: [stationOrders.orderId, stationOrders.id],
      name: "order_items_station_submission_fk",
    }).onDelete("cascade"),
    check(
      "order_items_quantity_cap",
      sql`${t.quantityLimit} between 1 and 100 and ${t.quantity} <= ${t.quantityLimit}`,
    ),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
).enableRLS();

/**
 * Order alert outbox (ADR 0022): one row per station ticket, written in the order's transaction
 * and drained on a schedule. The message can include a guest's note, so it is never logged.
 */
export const orderAlerts = pgTable(
  "order_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stationOrderId: uuid("station_order_id")
      .notNull()
      .references(() => stationOrders.id, { onDelete: "cascade" }),
    station: station("station").notNull(),
    message: text("message").notNull(),
    status: orderAlertStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    // One alert per ticket, so a replayed order can never queue a second message.
    uniqueIndex("order_alerts_station_order_key").on(t.stationOrderId),
    index("order_alerts_pending_idx").on(t.status, t.station, t.createdAt),
    check("order_alerts_attempts", sql`${t.attempts} between 0 and 100`),
    check("order_alerts_message", sql`char_length(${t.message}) between 1 and 4000`),
  ],
).enableRLS();

// Event configuration stays a draft until the venue time zone and other details are supplied.
export const eventSettings = pgTable(
  "event_settings",
  {
    id: integer("id").primaryKey().default(1),
    invitationVoice: text("invitation_voice").notNull().default("warm"),
    coupleNames: text("couple_names").array().notNull().default(["Uchenna", "Adaora"]),
    eventDate: date("event_date", { mode: "string" }).notNull().default("2026-12-19"),
    ceremonyTime: time("ceremony_time"),
    timeZone: text("time_zone"),
    venue: text("venue"),
    mapUrl: text("map_url"),
    dressCode: text("dress_code"),
    rsvpLockAt: timestamp("rsvp_lock_at", { withTimezone: true }),
    orderingOpen: boolean("ordering_open").notNull().default(false),
    activeThemeId: text("active_theme_id").notNull().default("ivory-gold"),
    activeDarkThemeId: text("active_dark_theme_id").notNull().default("midnight-champagne"),
    defaultMaxTagAlongs: integer("default_max_tag_alongs").notNull().default(1),
    retentionDays: integer("retention_days").notNull().default(90),
    maxOpenOrdersPerTable: integer("max_open_orders_per_table").notNull().default(3),
    orderCooldownSeconds: integer("order_cooldown_seconds").notNull().default(30),
    maxItemQuantity: integer("max_item_quantity").notNull().default(10),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("event_settings_singleton", sql`${t.id} = 1`),
    check(
      "event_settings_invitation_voice",
      sql`${t.invitationVoice} in ('warm', 'playful', 'formal')`,
    ),
    check(
      "event_settings_couple_names",
      sql`cardinality(${t.coupleNames}) = 2 and array_position(${t.coupleNames}, null) is null and array_ndims(${t.coupleNames}) = 1 and length(trim(${t.coupleNames}[1])) between 1 and 200 and length(trim(${t.coupleNames}[2])) between 1 and 200`,
    ),
    check("event_settings_tag_alongs", sql`${t.defaultMaxTagAlongs} between 0 and 10`),
    check("event_settings_retention", sql`${t.retentionDays} between 1 and 3650`),
    check(
      "event_settings_order_limits",
      sql`${t.maxOpenOrdersPerTable} between 1 and 100 and ${t.orderCooldownSeconds} between 0 and 86400 and ${t.maxItemQuantity} between 1 and 100`,
    ),
    check(
      "event_settings_cutoff_timezone",
      sql`${t.rsvpLockAt} is null or ${t.timeZone} is not null`,
    ),
    check(
      "event_settings_timezone_not_blank",
      sql`${t.timeZone} is null or length(trim(${t.timeZone})) > 0`,
    ),
    check(
      "event_settings_theme_not_blank",
      sql`length(trim(${t.activeThemeId})) between 1 and 100`,
    ),
    check(
      "event_settings_dark_theme_not_blank",
      sql`length(trim(${t.activeDarkThemeId})) between 1 and 100`,
    ),
    check("event_settings_map_https", sql`${t.mapUrl} is null or ${t.mapUrl} like 'https://%'`),
  ],
).enableRLS();

/** Append-only enforcement and runtime privilege revocations live in the custom migration. */
export const rsvpChanges = pgTable(
  "rsvp_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "restrict" }),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>().notNull(),
    actor: text("actor").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("rsvp_changes_invitation_changed_idx").on(t.invitationId, t.changedAt),
    check(
      "rsvp_changes_before_object",
      sql`${t.before} is null or jsonb_typeof(${t.before}) = 'object'`,
    ),
    check("rsvp_changes_after_object", sql`jsonb_typeof(${t.after}) = 'object'`),
    check("rsvp_changes_actor_not_blank", sql`length(trim(${t.actor})) between 1 and 200`),
  ],
).enableRLS();
