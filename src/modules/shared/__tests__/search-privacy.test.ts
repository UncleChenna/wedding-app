import { describe, expect, it } from "vitest";
import {
  NOINDEX_VALUE,
  ROBOTS_DISALLOW,
  isPrivatePath,
  noindexHeaderRules,
} from "../lib/search-privacy";

describe("search privacy", () => {
  it("treats personal, ordering, staff, admin and preview routes as private", () => {
    for (const path of [
      "/i/abc",
      "/p/xyz",
      "/order",
      "/staff",
      "/checkin",
      "/kitchen",
      "/bar",
      "/admin",
      "/admin/staff",
      "/dev/theme",
    ]) {
      expect(isPrivatePath(path), path).toBe(true);
    }
  });

  it("leaves the public home and invitation guide indexable", () => {
    for (const path of ["/", "/invite", "/barn", "/images/hero.jpg"]) {
      expect(isPrivatePath(path), path).toBe(false);
    }
  });

  it("emits a noindex header rule for each prefix and its children", () => {
    const rules = noindexHeaderRules();
    expect(rules.map((rule) => rule.source)).toEqual(
      expect.arrayContaining(["/i/:path*", "/p/:path*", "/staff", "/admin/:path*"]),
    );
    for (const rule of rules) {
      expect(rule.headers).toEqual([{ key: "X-Robots-Tag", value: NOINDEX_VALUE }]);
    }
  });

  it("disallows staff and admin in robots.txt but never personal links", () => {
    expect(ROBOTS_DISALLOW).toEqual(expect.arrayContaining(["/staff", "/admin"]));
    expect(ROBOTS_DISALLOW).not.toContain("/i");
    expect(ROBOTS_DISALLOW).not.toContain("/p");
  });
});
