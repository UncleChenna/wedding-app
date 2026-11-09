import { describe, expect, it } from "vitest";
import { decideAdmission, type AdmissionInvitation, type AdmissionRequest } from "../lib/admission";

const party = (
  count: number,
  overrides: Partial<AdmissionInvitation> = {},
): AdmissionInvitation => ({
  status: "rsvp_yes",
  tokenVersion: 2,
  attending: true,
  countAttending: count,
  ...overrides,
});
const scan = (overrides: Partial<AdmissionRequest>): AdmissionRequest => ({
  invitation: party(4),
  passVersion: 2,
  admittedSoFar: 0,
  ...overrides,
});

describe("decideAdmission: refusals", () => {
  it("is invalid for an unknown invitation, a draft or a pass from the future", () => {
    expect(decideAdmission(scan({ invitation: null }))).toEqual({
      result: "invalid",
      admit: 0,
      remaining: 0,
    });
    expect(decideAdmission(scan({ invitation: party(4, { status: "draft" }) })).result).toBe(
      "invalid",
    );
    expect(decideAdmission(scan({ passVersion: 3 })).result).toBe("invalid");
  });

  it("is revoked for a revoked invitation and for a pass replaced by a reissue", () => {
    expect(decideAdmission(scan({ invitation: party(4, { status: "revoked" }) })).result).toBe(
      "revoked",
    );
    expect(decideAdmission(scan({ passVersion: 1 }))).toEqual({
      result: "revoked",
      admit: 0,
      remaining: 0,
    });
  });

  it("is not RSVP'd unless they said yes, are attending and number at least one", () => {
    for (const invitation of [
      party(4, { status: "sent" }),
      party(4, { status: "rsvp_no" }),
      party(4, { attending: false }),
      party(4, { attending: null }),
      party(0),
    ])
      expect(decideAdmission(scan({ invitation })).result).toBe("not_rsvped");
  });
});

describe("decideAdmission: allowance boundaries", () => {
  it("admits the whole party by default and marks the pass used (0 → exact)", () => {
    expect(decideAdmission(scan({}))).toEqual({
      result: "valid",
      admit: 4,
      admittedAfter: 4,
      remaining: 0,
      fullyUsed: true,
    });
  });

  it("admits 2 now and 2 later; it is used only when the allowance is reached", () => {
    const first = decideAdmission(scan({ requested: 2 }));
    expect(first).toEqual({
      result: "valid",
      admit: 2,
      admittedAfter: 2,
      remaining: 2,
      fullyUsed: false,
    });
    const second = decideAdmission(scan({ admittedSoFar: 2, requested: 2 }));
    expect(second).toEqual({
      result: "valid",
      admit: 2,
      admittedAfter: 4,
      remaining: 0,
      fullyUsed: true,
    });
    expect(decideAdmission(scan({ admittedSoFar: 4 }))).toEqual({
      result: "already_used",
      admit: 0,
      remaining: 0,
    });
  });

  it("refuses to over-admit and admits nobody instead", () => {
    expect(decideAdmission(scan({ requested: 5 }))).toEqual({
      result: "too_many",
      admit: 0,
      remaining: 4,
    });
    expect(decideAdmission(scan({ admittedSoFar: 3, requested: 2 }))).toEqual({
      result: "too_many",
      admit: 0,
      remaining: 1,
    });
  });

  it("refuses a count that isn't a whole number of people", () => {
    for (const requested of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(decideAdmission(scan({ requested }))).toEqual({
        result: "bad_count",
        admit: 0,
        remaining: 4,
      });
  });

  it("treats an inconsistent counter as used, never as negative room", () => {
    expect(decideAdmission(scan({ admittedSoFar: 6 })).result).toBe("already_used");
    expect(decideAdmission(scan({ admittedSoFar: -3, requested: 4 }))).toMatchObject({
      result: "valid",
      admittedAfter: 4,
    });
  });
});

describe("decideAdmission: property", () => {
  // Small deterministic PRNG (mulberry32) so failures reproduce from the seed.
  function random(seed: number) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("never lets any sequence of admissions exceed count_attending", () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const next = random(seed);
      const count = Math.floor(next() * 12);
      const invitation = party(count);
      let admitted = 0;
      for (let step = 0; step < 15; step++) {
        const roll = next();
        const requested = roll < 0.2 ? undefined : Math.floor(next() * 8) - 1;
        const decision = decideAdmission({
          invitation,
          passVersion: 2,
          admittedSoFar: admitted,
          requested,
        });
        expect(decision.admit, `seed ${seed}`).toBeGreaterThanOrEqual(0);
        if (decision.result === "valid") {
          expect(decision.admittedAfter).toBe(admitted + decision.admit);
          expect(decision.fullyUsed).toBe(decision.admittedAfter === count);
        } else {
          expect(decision.admit).toBe(0);
        }
        admitted += decision.admit;
        expect(admitted, `seed ${seed}`).toBeLessThanOrEqual(count);
        if (admitted === count && count > 0)
          expect(
            decideAdmission({ invitation, passVersion: 2, admittedSoFar: admitted }).result,
          ).toBe("already_used");
      }
    }
  });
});
