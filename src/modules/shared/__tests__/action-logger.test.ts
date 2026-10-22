import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REDACTED } from "../lib/logger";
import { parseRequestId } from "../lib/request-id";
import { runLoggedAction } from "../server/action-logger";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

const lines: Array<Record<string, unknown>> = [];
beforeEach(() => {
  lines.length = 0;
  vi.spyOn(console, "log").mockImplementation((line: string) => lines.push(JSON.parse(line)));
  vi.spyOn(console, "error").mockImplementation((line: string) => lines.push(JSON.parse(line)));
  vi.mocked(headers).mockResolvedValue(new Headers());
});

describe("action logs", () => {
  it("correlates lifecycle and child logs without logging arguments or results", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ "x-request-id": "request-a" }));
    const result = { ok: false, error: "private result fixture" };
    expect(
      await runLoggedAction({ module: "invitations", action: "reply" }, async (log) => {
        log.child({ operation: "validate", requestId: "override" }).warn("expected failure", {
          requestId: "override",
          token: "secret-fixture",
          nested: [{ accessToken: "nested-fixture" }],
        });
        return result;
      }),
    ).toBe(result);
    expect(lines).toHaveLength(3);
    for (const line of lines)
      expect(line).toMatchObject({
        requestId: "request-a",
        module: "invitations",
        action: "reply",
      });
    expect(lines[1]).toMatchObject({ token: REDACTED, nested: [{ accessToken: REDACTED }] });
    expect(JSON.stringify(lines)).not.toMatch(
      /secret-fixture|nested-fixture|private result fixture/,
    );
    expect(lines[2]).toMatchObject({ msg: "action returned", durationMs: expect.any(Number) });
  });

  it.each([null, "", "x".repeat(65), "two,ids", "Bearer token", "bad\nvalue"])(
    "replaces invalid request id %j",
    async (id) => {
      // Invalid newline values cannot be constructed as real Headers, so exercise the pure parser too.
      expect(parseRequestId(id)).toBeUndefined();
      vi.mocked(headers).mockResolvedValue(
        new Headers(id && !id.includes("\n") ? { "x-request-id": id } : {}),
      );
      await runLoggedAction({ module: "test", action: "generated" }, async () => undefined);
      expect(lines[0]?.requestId).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
      expect(lines[1]?.requestId).toBe(lines[0]?.requestId);
    },
  );

  it("keeps concurrent calls isolated", async () => {
    vi.mocked(headers)
      .mockResolvedValueOnce(new Headers({ "x-request-id": "first-request" }))
      .mockResolvedValueOnce(new Headers({ "x-request-id": "second-request" }));
    await Promise.all(
      ["first", "second"].map((action) =>
        runLoggedAction({ module: "test", action }, async (log) => {
          await Promise.resolve();
          log.info("inside action");
        }),
      ),
    );
    for (const action of ["first", "second"]) {
      const records = lines.filter((line) => line.action === action);
      expect(records).toHaveLength(3);
      expect(new Set(records.map((line) => line.requestId))).toEqual(
        new Set([`${action}-request`]),
      );
    }
  });

  it("generates a fresh id per call when no header exists", async () => {
    await runLoggedAction({ module: "test", action: "one" }, async () => undefined);
    await runLoggedAction({ module: "test", action: "two" }, async () => undefined);
    expect(lines[0]?.requestId).not.toBe(lines[2]?.requestId);
  });

  it("preserves thrown errors without logging their private message or stack", async () => {
    const failure = new Error("token=private-exception-fixture");
    await expect(
      runLoggedAction({ module: "test", action: "failure" }, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(lines.map((line) => line.msg)).toEqual(["action started", "action threw"]);
    expect(lines[1]).toMatchObject({ level: "error", requestId: lines[0]?.requestId });
    expect(JSON.stringify(lines)).not.toContain("private-exception-fixture");
  });
});
