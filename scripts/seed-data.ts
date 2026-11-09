import { Faker, en } from "@faker-js/faker";

import { defaultEventSettings } from "../src/modules/shared/lib/event-settings";
import type * as schema from "../src/modules/shared/server/db/schema";
import { ACTIVE_THEME_IDS, listThemes } from "../src/modules/theming";

type Insert<T extends { $inferInsert: unknown }> = T["$inferInsert"];

export interface SeedData {
  eventSettings: Insert<typeof schema.eventSettings>;
  themes: Insert<typeof schema.themes>[];
  staff: Insert<typeof schema.staff>[];
  registeredDevices: Insert<typeof schema.registeredDevices>[];
  tables: Insert<typeof schema.tables>[];
  invitations: Insert<typeof schema.invitations>[];
  guests: Insert<typeof schema.guests>[];
  rsvps: Insert<typeof schema.rsvps>[];
  checkIns: Insert<typeof schema.checkIns>[];
  scanEvents: Insert<typeof schema.scanEvents>[];
  menuItems: Insert<typeof schema.menuItems>[];
  orders: Insert<typeof schema.orders>[];
  stationOrders: Insert<typeof schema.stationOrders>[];
  orderItems: Insert<typeof schema.orderItems>[];
}

const MENU: Array<Omit<Insert<typeof schema.menuItems>, "id" | "sortOrder">> = [
  {
    name: "Jollof rice & grilled chicken",
    category: "meal",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Coconut fried rice",
    category: "meal",
    station: "kitchen",
    dietaryTags: ["vegetarian"],
  },
  {
    name: "Beef suya skewers",
    category: "meal",
    station: "kitchen",
    dietaryTags: ["gluten-free"],
  },
  {
    name: "Plantain & bean stew",
    category: "meal",
    station: "kitchen",
    dietaryTags: ["vegan"],
  },
  {
    name: "Pepper soup",
    category: "meal",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Garden salad",
    category: "meal",
    station: "kitchen",
    dietaryTags: ["vegan", "gluten-free"],
  },
  {
    name: "Small chops platter",
    category: "meal",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Wedding cake slice",
    category: "meal",
    station: "kitchen",
    dietaryTags: ["vegetarian"],
  },
  { name: "Chapman (non-alcoholic)", category: "soft_drink", station: "bar", dietaryTags: [] },
  { name: "Zobo", category: "soft_drink", station: "bar", dietaryTags: ["vegan"] },
  {
    name: "Sparkling water",
    category: "soft_drink",
    station: "bar",
    dietaryTags: ["vegan"],
  },
  {
    name: "Orange juice",
    category: "soft_drink",
    station: "bar",
    dietaryTags: ["vegan"],
  },
  {
    name: "House red wine",
    category: "alcohol",
    station: "bar",
    dietaryTags: [],
  },
  {
    name: "House white wine",
    category: "alcohol",
    station: "bar",
    dietaryTags: [],
  },
  { name: "Lager", category: "alcohol", station: "bar", dietaryTags: [] },
  {
    name: "Champagne toast",
    category: "alcohol",
    station: "bar",
    dietaryTags: [],
  },
];

export type SeedProfile = "default" | "load";
export const SEED_TIME = new Date("2026-10-21T12:00:00Z");

/** Build synthetic local fixtures; never use deterministic tokens in production. */
export function buildSeedData(seed = 20261021, profile: SeedProfile = "default"): SeedData {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  const now = new Date(SEED_TIME);
  const token = (length: number) => faker.string.alphanumeric({ length, casing: "mixed" });

  const themes = listThemes().map((theme) => ({
    id: theme.id,
    name: theme.name,
    tokens: theme,
    // One theme per device colour scheme is active (src/modules/theming/config.ts).
    isActive: ACTIVE_THEME_IDS[theme.colorScheme] === theme.id,
  }));

  const staff: SeedData["staff"] = (
    [
      ["admin", "Wedding Admin"],
      ["gate", "Gate Staff"],
      ["kitchen", "Kitchen Lead"],
      ["bar", "Bar Lead"],
    ] as const
  ).map(([role, name]) => ({
    id: faker.string.uuid(),
    name,
    role,
    email: `${role}@example.test`,
    pinHash: null,
    pinIssuedAt: null,
    pinExpiresAt: null,
    credentialVersion: 1,
    revokedAt: null,
  }));

  const registeredDevices: SeedData["registeredDevices"] = [
    { id: "gate-phone-1", name: "Gate phone 1", role: "gate", registeredAt: now },
    { id: "kitchen-tablet-1", name: "Kitchen tablet", role: "kitchen", registeredAt: now },
    { id: "bar-tablet-1", name: "Bar tablet", role: "bar", registeredAt: now },
  ];

  const tables: SeedData["tables"] = Array.from(
    { length: profile === "load" ? 30 : 28 },
    (_, i) => ({
      id: faker.string.uuid(),
      number: i + 1,
      name: i === 0 ? "Top table" : null,
      capacity: profile === "load" ? 12 : 10,
    }),
  );

  const invitations: SeedData["invitations"] = [];
  const guests: SeedData["guests"] = [];
  const rsvps: SeedData["rsvps"] = [];

  for (let i = 0; profile === "load" ? guests.length < 350 : i < 110; i++) {
    const invitationId = faker.string.uuid();
    const lastName = faker.person.lastName();
    const generatedSize = faker.helpers.weightedArrayElement([
      { weight: 35, value: 1 },
      { weight: 40, value: 2 },
      { weight: 15, value: 3 },
      { weight: 10, value: 4 },
    ]);
    const householdSize =
      profile === "load" ? Math.min(generatedSize, 350 - guests.length) : generatedSize;
    const tagAlongSeats =
      profile === "load" ? 0 : (faker.helpers.maybe(() => 1, { probability: 0.3 }) ?? 0);
    invitations.push({
      id: invitationId,
      token: token(43),
      householdName:
        householdSize > 1 ? `The ${lastName} household` : `${faker.person.firstName()} ${lastName}`,
      maxTagAlongs: householdSize - 1 + tagAlongSeats,
      sentAt:
        faker.helpers.maybe(() => faker.date.recent({ days: 30, refDate: now }), {
          probability: 0.8,
        }) ?? null,
    });

    const status =
      profile === "load"
        ? "attending"
        : i === 0
          ? "pending"
          : i === 1
            ? "declined"
            : faker.helpers.weightedArrayElement([
                { weight: 70, value: "attending" as const },
                { weight: 12, value: "declined" as const },
                { weight: 18, value: "pending" as const },
              ]);
    const currentInvitation = invitations[invitations.length - 1];
    if (currentInvitation)
      currentInvitation.status =
        profile === "default" && i === 0
          ? "revoked"
          : status === "attending"
            ? "rsvp_yes"
            : status === "declined"
              ? "rsvp_no"
              : currentInvitation.sentAt
                ? "sent"
                : "draft";
    if (status !== "pending")
      rsvps.push({
        id: faker.string.uuid(),
        invitationId,
        attending: status === "attending",
        countAttending: status === "attending" ? householdSize + tagAlongSeats : 0,
        message:
          status === "attending"
            ? (faker.helpers.maybe(() => faker.lorem.sentence(), {
                probability: 0.4,
              }) ?? null)
            : null,
        respondedAt: faker.date.recent({ days: 20, refDate: now }),
      });

    for (let g = 0; g < householdSize; g++) {
      guests.push({
        id: faker.string.uuid(),
        invitationId,
        name: `${faker.person.firstName()} ${lastName}`,
        email:
          g === 0
            ? faker.internet.email({ lastName, provider: "example.test" }).toLowerCase()
            : null,
        phone: g === 0 ? faker.phone.number({ style: "international" }) : null,
        isPrimary: g === 0,
        dietaryNotes:
          faker.helpers.maybe(
            () =>
              faker.helpers.arrayElement([
                "Vegetarian",
                "Vegan",
                "Nut allergy",
                "Gluten-free",
                "Halal",
              ]),
            { probability: 0.15 },
          ) ?? null,
      });
    }
    if (tagAlongSeats && status === "attending") {
      guests.push({
        id: faker.string.uuid(),
        invitationId,
        name: faker.person.fullName(),
        isPrimary: false,
      });
    }
  }

  // Seat attending guests, filling tables in order (household stays together).
  const attending = new Set(rsvps.filter((r) => r.attending).map((r) => r.invitationId));
  const seated = new Map<string, number>();
  for (const invitation of invitations) {
    if (!invitation.id) throw new Error("Seed invitation requires an ID");
    if (!attending.has(invitation.id)) continue;
    const household = guests.filter((guest) => guest.invitationId === invitation.id);
    const table = tables.find(
      (candidate) =>
        candidate.id && candidate.capacity - (seated.get(candidate.id) ?? 0) >= household.length,
    );
    if (!table?.id) throw new Error("Seed capacity cannot seat a complete household");
    invitation.tableId = table.id;
    for (const guest of household) guest.tableId = table.id;
    seated.set(table.id, (seated.get(table.id) ?? 0) + household.length);
  }

  const gate = staff.find((s) => s.role === "gate")!;
  const partial = rsvps.find((rsvp) => rsvp.attending && rsvp.countAttending > 1);
  if (!partial || !gate.id)
    throw new Error("Seed requires a partial-admission household and gate staff");
  const checkIns: SeedData["checkIns"] = faker.helpers
    .arrayElements(
      guests.filter((g) => g.tableId && g.invitationId !== partial.invitationId),
      30,
    )
    .map((guest) => ({
      id: faker.string.uuid(),
      guestId: guest.id!,
      staffId: gate.id!,
      checkedInAt: faker.date.recent({ days: 1, refDate: now }),
      deviceId: "gate-phone-1",
      clientEventId: faker.string.uuid(),
    }));

  const menuItems: SeedData["menuItems"] = MENU.map((item, i) => ({
    ...item,
    id: faker.string.uuid(),
    sortOrder: i,
    maxPerOrder: 5,
    isAvailable: i !== MENU.length - 1,
    description:
      faker.helpers.maybe(() => faker.lorem.sentence({ min: 4, max: 9 }), {
        probability: 0.6,
      }) ?? null,
  }));

  const orders: SeedData["orders"] = [];
  const stationOrders: SeedData["stationOrders"] = [];
  const orderItems: SeedData["orderItems"] = [];
  const usedTables = tables.filter((t) => seated.has(t.id!));
  const firstMeal = menuItems.find((item) => item.station === "kitchen");
  const firstDrink = menuItems.find((item) => item.station === "bar");
  if (!firstMeal || !firstDrink) throw new Error("Seed menu must cover both stations");
  for (let i = 0; i < 18; i++) {
    const orderId = faker.string.uuid();
    const status = faker.helpers.arrayElement([
      "received",
      "preparing",
      "cancelled",
      "served",
    ] as const);
    const submittedAt = faker.date.recent({ days: 1, refDate: now });
    orders.push({
      id: orderId,
      clientRequestId: faker.string.uuid(),
      tableId: faker.helpers.arrayElement(usedTables).id!,
      guestName: faker.person.firstName(),
      status,
      createdAt: submittedAt,
    });
    const selected =
      i === 0
        ? [firstMeal, firstDrink]
        : faker.helpers.arrayElements(menuItems, { min: 1, max: 3 });
    const children = new Map<"kitchen" | "bar", string>();
    for (const item of selected) {
      let childId = children.get(item.station);
      if (!childId) {
        childId = faker.string.uuid();
        children.set(item.station, childId);
        stationOrders.push({
          id: childId,
          orderId,
          station: item.station,
          status,
          createdAt: submittedAt,
        });
      }
      if (!item.id) throw new Error("Seed menu item requires an ID");
      const quantityLimit = item.maxPerOrder ?? 5;
      orderItems.push({
        id: faker.string.uuid(),
        orderId,
        stationOrderId: childId,
        menuItemId: item.id,
        quantity: faker.number.int({ min: 1, max: Math.min(3, quantityLimit) }),
        quantityLimit,
      });
    }
  }

  const scanEvents: SeedData["scanEvents"] = [
    ...checkIns.map((checkIn) => {
      const guest = guests.find((candidate) => candidate.id === checkIn.guestId);
      if (!guest) throw new Error("Seed archive has no named guest");
      return {
        id: faker.string.uuid(),
        clientEventId: checkIn.clientEventId,
        invitationId: guest.invitationId,
        staffId: gate.id,
        deviceId: "gate-phone-1",
        reportedAt: checkIn.checkedInAt,
        receivedAt: now,
        reportedResult: "valid" as const,
        result: "valid" as const,
        reportedPeople: 1,
        admittedPeople: 1,
        conflict: false,
        source: "legacy",
        legacyCheckInId: checkIn.id,
      };
    }),
    {
      id: faker.string.uuid(),
      clientEventId: faker.string.uuid(),
      invitationId: partial.invitationId,
      staffId: gate.id,
      deviceId: "gate-phone-1",
      reportedAt: now,
      receivedAt: now,
      reportedResult: "valid",
      result: "valid",
      reportedPeople: 1,
      admittedPeople: 1,
      conflict: false,
      source: "online",
    },
  ];
  // Explicit timestamps avoid database defaultNow() changing persisted row hashes.
  const timestamps = <T extends object>(rows: T[]) =>
    rows.map((row) => ({
      createdAt: now,
      ...row,
      updatedAt: now,
    }));
  return {
    eventSettings: {
      ...defaultEventSettings,
      coupleNames: [...defaultEventSettings.coupleNames],
      updatedAt: now,
    },
    themes: timestamps(themes),
    staff: timestamps(staff),
    registeredDevices: registeredDevices.map((row) => ({ ...row, updatedAt: now })),
    tables: timestamps(tables),
    invitations: timestamps(invitations),
    guests: timestamps(guests),
    rsvps: timestamps(rsvps),
    checkIns: checkIns.map((row) => ({ ...row, createdAt: now })),
    scanEvents,
    menuItems: timestamps(menuItems),
    orders: timestamps(orders),
    stationOrders: timestamps(stationOrders),
    orderItems: timestamps(orderItems),
  };
}
