import { describe, expect, it } from "vitest";
import { compareMigrationHistory } from "../migration-history";
import develop from "../fixtures/t216-develop-history.json";
import experimental from "../fixtures/t211-branch-history.json";

const source = develop.entries.map((entry) => ({ hash: entry.sha256, createdAt: entry.when }));
const applied = (entries: typeof source) =>
  entries.map((entry) => ({ ...entry, createdAt: String(entry.createdAt) }));

describe("applied migration lineage protection", () => {
  it("allows a fresh target and reports every source migration pending", () => {
    expect(compareMigrationHistory([], source)).toEqual({ ok: true, pending: source.length });
  });
  it("allows only an exact applied prefix", () => {
    expect(compareMigrationHistory(applied(source.slice(0, 6)), source)).toEqual({
      ok: true,
      pending: 7,
    });
  });
  it("recognises a repeated migration with nothing pending", () => {
    expect(compareMigrationHistory(applied(source), source)).toEqual({ ok: true, pending: 0 });
  });
  it("rejects the real experimental fork after its six shared migrations", () => {
    const fork = experimental.entries.map((entry) => ({
      hash: entry.sha256,
      createdAt: String(entry.when),
    }));
    expect(compareMigrationHistory(fork, source)).toEqual({
      ok: false,
      code: "unrecognized-history",
    });
  });
  it("rejects a missing intermediate journal entry", () => {
    expect(
      compareMigrationHistory(applied(source.filter((_, index) => index !== 2)), source),
    ).toEqual({ ok: false, code: "unrecognized-history" });
  });
  it("rejects a changed timestamp even when SQL hashes match", () => {
    const rows = applied(source).map((entry, index) =>
      index === 2 ? { ...entry, createdAt: String(Number(entry.createdAt) + 1) } : entry,
    );
    expect(compareMigrationHistory(rows, source)).toEqual({
      ok: false,
      code: "unrecognized-history",
    });
  });
  it("refuses a database ahead of the reviewed source", () => {
    expect(
      compareMigrationHistory(
        [...applied(source), { hash: "f".repeat(64), createdAt: "9999999999999" }],
        source,
      ),
    ).toEqual({ ok: false, code: "unrecognized-history" });
  });
  it("rejects malformed applied data without returning sensitive values", () => {
    expect(
      compareMigrationHistory([{ hash: "do-not-repeat-credential", createdAt: null }], source),
    ).toEqual({ ok: false, code: "unrecognized-history" });
  });
  it("rejects empty, unordered or duplicate source timestamps", () => {
    expect(compareMigrationHistory([], [])).toEqual({ ok: false, code: "invalid-source-history" });
    expect(compareMigrationHistory([], [...source].reverse())).toEqual({
      ok: false,
      code: "invalid-source-history",
    });
    expect(compareMigrationHistory([], [...source, ...source])).toEqual({
      ok: false,
      code: "invalid-source-history",
    });
  });
});
