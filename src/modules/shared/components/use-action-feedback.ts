"use client";

import { useEffect, useRef } from "react";
import { useOptionalToast, type ToastTone } from "./ui/toast";

export interface ActionFeedbackState {
  status?: string;
  message?: string;
  ok?: boolean;
}

const successful = new Set([
  "saved",
  "created",
  "updated",
  "deleted",
  "revoked",
  "signed-in",
  "signed-out",
  "code-sent",
  "yes",
  "no",
  "received",
  "verified",
  "setup",
  "closed",
  "issued",
  "activated",
  "committed",
]);
function resultTone(state: ActionFeedbackState): ToastTone {
  if (state.ok === true || successful.has(state.status ?? "")) return "success";
  return "danger";
}

/** Notify once per returned action result, including repeated identical submissions.
 * Initial server state is not a new transaction. Never copy arbitrary result fields (PINs/tokens).
 */
export function useActionFeedback(state: ActionFeedbackState | null | undefined) {
  const notifications = useOptionalToast();
  const previous = useRef(state);
  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    if (!state || state.status === "idle" || !state.message) return;
    notifications?.toast({
      title: state.message,
      tone: resultTone(state),
    });
  }, [state, notifications]);
}

/** Notify only when a user-facing message changes, not on every background poll.
 * Pass an empty message while work is pending; retain detailed feedback in the page.
 */
export function useFeedbackMessage(message: string, tone: ToastTone = "default") {
  const notifications = useOptionalToast();
  const previous = useRef(message);
  useEffect(() => {
    if (previous.current === message) return;
    previous.current = message;
    if (message) notifications?.toast({ title: message, tone });
  }, [message, tone, notifications]);
}

/** Use when a successful mutation removes its own row before an effect can run. */
export function useNotifiedAction<S extends ActionFeedbackState, P>(
  action: (previous: S, payload: P) => Promise<S>,
) {
  const notifications = useOptionalToast();
  return async (previous: S, payload: P): Promise<S> => {
    const result = await action(previous, payload);
    if (result.message)
      notifications?.toast({
        title: result.message,
        tone: resultTone(result),
      });
    return result;
  };
}
