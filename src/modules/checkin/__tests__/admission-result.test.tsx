// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdmissionResult, type AdmissionSubmitter } from "../components/admission-result";
const result = {
  state: "valid" as const,
  guest: { name: "Ada", partySize: 4, admittedSoFar: 0, tableNumber: 7, admissions: [] },
};
it("keeps cached valid checks read-only without an admission form or receipt", () => {
  const submit = vi.fn<AdmissionSubmitter>();
  render(
    <AdmissionResult
      result={result}
      qr="private QR"
      submit={submit}
      onBusyChange={() => {}}
      allowAdmission={false}
      readOnlyNotice="List not refreshed for 31 min. New changes may not show."
    />,
  );
  expect(screen.getByRole("heading", { name: "Valid pass" })).toBeVisible();
  expect(
    screen.getByText("List not refreshed for 31 min. New changes may not show."),
  ).toBeVisible();
  expect(screen.queryByLabelText("How many are here?")).toBeNull();
  expect(screen.queryByRole("button", { name: /Admit/ })).toBeNull();
  expect(screen.getByText(/No admission has been recorded by this check/)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("defaults to remaining and shows welcome only after the committed selected count", async () => {
  const submit = vi.fn<AdmissionSubmitter>(async () => ({
    state: "recorded" as const,
    people: 2,
    admittedSoFar: 2,
    remaining: 2,
    name: "Ada",
    tableNumber: 7,
    recordedAt: "2026-12-19T12:00:00.000Z",
  }));
  render(
    <AdmissionResult result={result} qr="private QR" submit={submit} onBusyChange={() => {}} />,
  );
  expect(screen.getByLabelText("How many are here?")).toHaveValue(4);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "One fewer guest" }));
  fireEvent.click(screen.getByRole("button", { name: "One fewer guest" }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 2 guests" })));
  expect(submit.mock.calls[0]?.[0]).toMatchObject({
    qr: "private QR",
    people: 2,
    clientEventId: expect.any(String),
  });
  expect(screen.getByRole("heading", { name: "Admission recorded" })).toBeVisible();
  expect(screen.getByText("Welcome, Ada. Table 7 is ready for you.")).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Valid pass" })).toBeNull();
});
it("keeps the exact request for uncertain retry and labels duplicate as historical only", async () => {
  const submit = vi.fn().mockRejectedValueOnce(new Error("connection lost")).mockResolvedValueOnce({
    state: "duplicate",
    people: 4,
    recordedAt: "2026-12-19T12:00:00.000Z",
  });
  const busy = vi.fn();
  const { rerender } = render(
    <AdmissionResult result={result} qr="private QR" submit={submit} onBusyChange={busy} />,
  );
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 4 guests" })));
  rerender(
    <AdmissionResult
      result={result}
      qr="private QR"
      submit={submit}
      onBusyChange={busy}
      allowAdmission={false}
    />,
  );
  expect(screen.getByLabelText("How many are here?")).toBeDisabled();
  expect(busy).toHaveBeenLastCalledWith(true);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Retry this admission" })),
  );
  expect(submit.mock.calls[1]?.[0]).toEqual(submit.mock.calls[0]?.[0]);
  expect(screen.getByRole("heading", { name: "Already recorded" })).toBeVisible();
  expect(screen.queryByText(/Welcome,/)).toBeNull();
  expect(busy).toHaveBeenLastCalledWith(false);
});
it("shows a clear over-admit refusal without a welcome or another submit button", async () => {
  render(
    <AdmissionResult
      result={result}
      qr="private QR"
      submit={async () => ({ state: "too_many", remaining: 1 })}
      onBusyChange={() => {}}
    />,
  );
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 4 guests" })));
  expect(screen.getByText(/Only 1 place remains/)).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Admission recorded" })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Admit/ })).toBeNull();
});

it.each(["invalid", "revoked", "conflict", "session_expired"] as const)(
  "uses the fixed danger status for a %s submission refusal",
  async (state) => {
    render(
      <AdmissionResult
        result={result}
        qr="private QR"
        submit={async () => ({ state })}
        onBusyChange={() => {}}
      />,
    );
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 4 guests" })));
    expect(screen.getByText("Not admitted", { exact: true })).toHaveClass("bg-danger");
    expect(screen.queryByText(/Welcome,/)).toBeNull();
  },
);

it.each(["headers", "body"])("bounds stalled %s and retries the exact intent", async (stage) => {
  vi.useFakeTimers();
  let firstBody: BodyInit | null | undefined;
  const request = vi
    .fn<typeof fetch>()
    .mockImplementationOnce(async (_url, init) => {
      firstBody = init?.body;
      const stalled = () =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      if (stage === "headers") return stalled();
      const response = new Response("{}");
      vi.spyOn(response, "json").mockImplementation(stalled);
      return response;
    })
    .mockImplementationOnce(async (_url, init) => {
      expect(init?.body).toBe(firstBody);
      return Response.json({
        state: "duplicate",
        people: 4,
        recordedAt: "2026-12-19T12:00:00.000Z",
      });
    });
  vi.stubGlobal("fetch", request);
  const busy = vi.fn();
  render(<AdmissionResult result={result} qr="private QR" onBusyChange={busy} />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 4 guests" })));
  await act(async () => vi.advanceTimersByTimeAsync(7999));
  expect(screen.getByRole("button", { name: "Confirming admission…" })).toBeDisabled();
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole("button", { name: "Retry this admission" })).toBeEnabled();
  expect(busy).toHaveBeenLastCalledWith(true);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Retry this admission" })),
  );
  expect(screen.getByRole("heading", { name: "Already recorded" })).toBeVisible();
  expect(request).toHaveBeenCalledTimes(2);
  expect(busy).toHaveBeenLastCalledWith(false);
});

it("aborts the transport and removes its timer when the result unmounts", async () => {
  vi.useFakeTimers();
  const aborted = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(
      async (_url, init) =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted();
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        }),
    ),
  );
  const complete = vi.fn();
  const { unmount } = render(
    <AdmissionResult
      result={result}
      qr="private QR"
      onBusyChange={() => {}}
      onComplete={complete}
    />,
  );
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 4 guests" })));
  await act(async () => unmount());
  expect(aborted).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
  expect(complete).not.toHaveBeenCalled();
});
