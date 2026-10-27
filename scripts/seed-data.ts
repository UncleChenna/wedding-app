import { Faker, en } from "@faker-js/faker";

import type * as schema from "../src/modules/shared/server/db/schema";
import { ACTIVE_THEME_IDS, listThemes } from "../src/modules/theming";

type Insert<T extends { $inferInsert: unknown }> = T["$inferInsert"];

export interface SeedData {
  themes: Insert<typeof schema.themes>[];
  staff: Insert<typeof schema.staff>[];
  tables: Insert<typeof schema.tables>[];
  invitations: Insert<typeof schema.invitations>[];
  guests: Insert<typeof schema.guests>[];
  rsvps: Insert<typeof schema.rsvps>[];
  checkIns: Insert<typeof schema.checkIns>[];
  menuItems: Insert<typeof schema.menuItems>[];
  orders: Insert<typeof schema.orders>[];
  orderItems: Insert<typeof schema.orderItems>[];
}

const MENU: Array<Omit<Insert<typeof schema.menuItems>, "id" | "sortOrder">> = [
  {
    name: "Jollof rice & grilled chicken",
    category: "food",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Coconut fried rice",
    category: "food",
    station: "kitchen",
    dietaryTags: ["vegetarian"],
  },
  {
    name: "Beef suya skewers",
    category: "food",
    station: "kitchen",
    dietaryTags: ["gluten-free"],
  },
  {
    name: "Plantain & bean stew",
    category: "food",
    station: "kitchen",
    dietaryTags: ["vegan"],
  },
  {
    name: "Pepper soup",
    category: "food",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Garden salad",
    category: "food",
    station: "kitchen",
    dietaryTags: ["vegan", "gluten-free"],
  },
  {
    name: "Small chops platter",
    category: "food",
    station: "kitchen",
    dietaryTags: [],
  },
  {
    name: "Wedding cake slice",
    category: "food",
    station: "kitchen",
    dietaryTags: ["vegetarian"],
  },
  { name: "Chapman", category: "drink", station: "bar", dietaryTags: [] },
  { name: "Zobo", category: "drink", station: "bar", dietaryTags: ["vegan"] },
  {
    name: "Sparkling water",
    category: "drink",
    station: "bar",
    dietaryTags: ["vegan"],
  },
  {
    name: "Orange juice",
    category: "drink",
    station: "bar",
    dietaryTags: ["vegan"],
  },
  {
    name: "House red wine",
    category: "drink",
    station: "bar",
    dietaryTags: [],
  },
  {
    name: "House white wine",
    category: "drink",
    station: "bar",
    dietaryTags: [],
  },
  { name: "Lager", category: "drink", station: "bar", dietaryTags: [] },
  {
    name: "Champagne toast",
    category: "drink",
    station: "bar",
    dietaryTags: [],
  },
];

/** Build a deterministic fake data set: same seed, same data. */
export function buildSeedData(seed = 20261021): SeedData {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  const now = new Date("2026-10-21T12:00:00Z");
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
  }));

  const tables: SeedData["tables"] = Array.from({ length: 28 }, (_, i) => ({
    id: faker.string.uuid(),
    number: i + 1,
    name: i === 0 ? "Top table" : null,
    capacity: 10,
  }));

  const invitations: SeedData["invitations"] = [];
  const guests: SeedData["guests"] = [];
  const rsvps: SeedData["rsvps"] = [];

  for (let i = 0; i < 110; i++) {
    const invitationId = faker.string.uuid();
    const lastName = faker.person.lastName();
    const householdSize = faker.helpers.weightedArrayElement([
      { weight: 35, value: 1 },
      { weight: 40, value: 2 },
      { weight: 15, value: 3 },
      { weight: 10, value: 4 },
    ]);
    const tagAlongSeats = faker.helpers.maybe(() => 1, { probability: 0.3 }) ?? 0;
    invitations.push({
      id: invitationId,
      code: token(12),
      householdName:
        householdSize > 1 ? `The ${lastName} household` : `${faker.person.firstName()} ${lastName}`,
      maxGuests: householdSize + tagAlongSeats,
      sentAt:
        faker.helpers.maybe(() => faker.date.recent({ days: 30, refDate: now }), {
          probability: 0.8,
        }) ?? null,
    });

    const status = faker.helpers.weightedArrayElement([
      { weight: 70, value: "attending" as const },
      { weight: 12, value: "declined" as const },
      { weight: 18, value: "pending" as const },
    ]);
    rsvps.push({
      id: faker.string.uuid(),
      invitationId,
      status,
      message:
        status === "attending"
          ? (faker.helpers.maybe(() => faker.lorem.sentence(), {
              probability: 0.4,
            }) ?? null)
          : null,
      respondedAt: status === "pending" ? null : faker.date.recent({ days: 20, refDate: now }),
    });

    for (let g = 0; g < householdSize; g++) {
      guests.push({
        id: faker.string.uuid(),
        invitationId,
        firstName: faker.person.firstName(),
        lastName,
        email:
          g === 0
            ? faker.internet.email({ lastName, provider: "example.test" }).toLowerCase()
            : null,
        phone: g === 0 ? faker.phone.number({ style: "international" }) : null,
        isPrimary: g === 0,
        isTagAlong: false,
        dietaryRequirements:
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
        qrToken: token(24),
      });
    }
    if (tagAlongSeats && status === "attending") {
      guests.push({
        id: faker.string.uuid(),
        invitationId,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        isPrimary: false,
        isTagAlong: true,
        qrToken: token(24),
      });
    }
  }

  // Seat attending guests, filling tables in order (household stays together).
  const attending = new Set(
    rsvps.filter((r) => r.status === "attending").map((r) => r.invitationId),
  );
  const seated = new Map<string, number>();
  let tableIndex = 1; // table 1 is the top table, left empty for the couple
  for (const guest of guests) {
    if (!attending.has(guest.invitationId)) continue;
    let table = tables[tableIndex];
    if (table && (seated.get(table.id!) ?? 0) >= table.capacity) table = tables[++tableIndex];
    if (!table) break;
    guest.tableId = table.id!;
    seated.set(table.id!, (seated.get(table.id!) ?? 0) + 1);
  }

  const gate = staff.find((s) => s.role === "gate")!;
  const checkIns: SeedData["checkIns"] = faker.helpers
    .arrayElements(
      guests.filter((g) => g.tableId),
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
    description:
      faker.helpers.maybe(() => faker.lorem.sentence({ min: 4, max: 9 }), {
        probability: 0.6,
      }) ?? null,
  }));

  const orders: SeedData["orders"] = [];
  const orderItems: SeedData["orderItems"] = [];
  const usedTables = tables.filter((t) => seated.has(t.id!));
  for (let i = 0; i < 18; i++) {
    const orderId = faker.string.uuid();
    orders.push({
      id: orderId,
      tableId: faker.helpers.arrayElement(usedTables).id!,
      guestName: faker.person.firstName(),
      status: faker.helpers.arrayElement(["received", "preparing", "ready", "served"] as const),
      createdAt: faker.date.recent({ days: 1, refDate: now }),
    });
    for (const item of faker.helpers.arrayElements(menuItems, {
      min: 1,
      max: 3,
    })) {
      orderItems.push({
        id: faker.string.uuid(),
        orderId,
        menuItemId: item.id!,
        quantity: faker.number.int({ min: 1, max: 3 }),
      });
    }
  }

  return {
    themes,
    staff,
    tables,
    invitations,
    guests,
    rsvps,
    checkIns,
    menuItems,
    orders,
    orderItems,
  };
}
