import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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

// ─── Enums ────────────────────────────────────────────────────────────────

export const staffRole = pgEnum("staff_role", ["admin", "gate", "kitchen", "bar"]);
export const rsvpStatus = pgEnum("rsvp_status", ["pending", "attending", "declined"]);
export const menuCategory = pgEnum("menu_category", ["food", "drink"]);
export const station = pgEnum("station", ["kitchen", "bar"]);
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
  isActive: boolean("is_active").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

// ─── Staff ────────────────────────────────────────────────────────────────

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Supabase auth.users id, linked when the staff member first signs in. */
  authUserId: uuid("auth_user_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: staffRole("role").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

// ─── Invitations ──────────────────────────────────────────────────────────

/** One invitation per household. `code` is the secret in the personal link. */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    householdName: text("household_name").notNull(),
    /** Total seats including tag-alongs the household may add. */
    maxGuests: integer("max_guests").notNull().default(1),
    notes: text("notes"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("invitations_max_guests_positive", sql`${t.maxGuests} > 0`)],
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
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    /** The named invitee (false for tag-alongs added by the household). */
    isPrimary: boolean("is_primary").notNull().default(false),
    isTagAlong: boolean("is_tag_along").notNull().default(false),
    dietaryRequirements: text("dietary_requirements"),
    tableId: uuid("table_id").references(() => tables.id, {
      onDelete: "set null",
    }),
    /** Secret encoded in the guest's gate QR code. */
    qrToken: text("qr_token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("guests_invitation_id_idx").on(t.invitationId),
    index("guests_table_id_idx").on(t.tableId),
  ],
).enableRLS();

/** One RSVP per invitation. */
export const rsvps = pgTable("rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .unique()
    .references(() => invitations.id, { onDelete: "cascade" }),
  status: rsvpStatus("status").notNull().default("pending"),
  message: text("message"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

// ─── Gate check-in ────────────────────────────────────────────────────────

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

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: menuCategory("category").notNull(),
  station: station("station").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  dietaryTags: text("dietary_tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
).enableRLS();
