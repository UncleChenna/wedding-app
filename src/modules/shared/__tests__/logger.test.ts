import { describe, expect, it } from "vitest";

import { createLogger, REDACTED, type LogLevel } from "../lib/logger";

function capture(level: LogLevel = "debug") {
  const lines: Array<{ level: LogLevel; line: string }> = [];
  const log = createLogger(
    { app: "test" },
    {
      level,
      format: "json",
      now: () => new Date("2026-01-01T00:00:00Z"),
      write: (lvl, line) => lines.push({ level: lvl, line }),
    },
  );
  return {
    log,
    lines,
    json: () => lines.map((l) => JSON.parse(l.line) as Record<string, unknown>),
  };
}

describe("logger", () => {
  it("writes one JSON object per line with bindings and fields", () => {
    const { log, json } = capture();
    log.info("guest checked in", { guestId: "g1" });
    expect(json()).toEqual([
      {
        level: "info",
        time: "2026-01-01T00:00:00.000Z",
        msg: "guest checked in",
        app: "test",
        guestId: "g1",
      },
    ]);
  });

  it("filters below the configured level", () => {
    const { log, lines } = capture("warn");
    log.debug("a");
    log.info("b");
    log.warn("c");
    log.error("d");
    expect(lines.map((l) => l.level)).toEqual(["warn", "error"]);
  });

  it("redacts sensitive keys at any depth", () => {
    const { log, json } = capture();
    log.info("login", {
      password: "x",
      user: { apiKey: "k", name: "Ada" },
      headers: { authorization: "Bearer t" },
    });
    expect(json()[0]).toMatchObject({
      password: REDACTED,
      user: { apiKey: REDACTED, name: "Ada" },
      headers: { authorization: REDACTED },
    });
  });

  it("serialises errors", () => {
    const { log, json } = capture();
    log.error("boom", { error: new Error("bad") });
    expect(json()[0]).toMatchObject({
      error: { name: "Error", message: "bad" },
    });
  });

  it("child loggers merge bindings", () => {
    const { log, json } = capture();
    log.child({ module: "ordering" }).info("order placed");
    expect(json()[0]).toMatchObject({ app: "test", module: "ordering" });
  });
});

describe("request correlation and bounded redaction", () => {
  it("keeps a bound request id on child and per-message fields", () => {
    const { log, json } = capture();
    const request = log.child({ requestId: "request-a" });
    request.info("first", { requestId: "spoofed" });
    request.child({ requestId: "spoofed-child" }).warn("second");
    expect(json().map((line) => line.requestId)).toEqual(["request-a", "request-a"]);
  });

  it("never emits raw objects beyond the recursion limit", () => {
    const { log, lines } = capture();
    let value: Record<string, unknown> = { token: "deep-secret-fixture" };
    for (let depth = 0; depth < 10; depth++) value = { nested: value };
    log.info("bounded", { value });
    expect(lines[0]?.line).not.toContain("deep-secret-fixture");
    expect(lines[0]?.line).toContain("[truncated]");
  });
});
