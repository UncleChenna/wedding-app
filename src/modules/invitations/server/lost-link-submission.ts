import "server-only";
import { lostLinkRequestSchema, type LostLinkRequest } from "../lib/lost-link";

type SubmissionDependencies = {
  budget: () => Promise<{ status: "allowed" | "limited" | "unavailable" }>;
  save: (request: LostLinkRequest) => Promise<void>;
};
export type LostLinkSubmissionResult = {
  status: "received" | "invalid" | "retry" | "unavailable";
  message: string;
};

/** Deliberately has no guest lookup dependency: matching belongs to the private admin queue. */
export async function submitLostLinkRequest(
  input: unknown,
  dependencies: SubmissionDependencies,
): Promise<LostLinkSubmissionResult> {
  const unavailable: LostLinkSubmissionResult = {
    status: "unavailable",
    message: "We couldn’t save your request just now. Please try again shortly.",
  };
  try {
    const budget = await dependencies.budget();
    if (budget.status === "unavailable") return unavailable;
    if (budget.status === "limited") {
      return { status: "retry", message: "Please wait a minute before trying again." };
    }
    const parsed = lostLinkRequestSchema.safeParse(input);
    if (!parsed.success) {
      return {
        status: "invalid",
        message: "Please enter your name and a valid email or full phone number.",
      };
    }
    await dependencies.save(parsed.data);
    return {
      status: "received",
      message:
        "Thank you. Your request is with us. If we can find your invitation, we’ll help you get your link again.",
    };
  } catch {
    // Database exceptions may include submitted contact information. Do not expose or log them.
    return unavailable;
  }
}
