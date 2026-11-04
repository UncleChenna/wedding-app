"use client";
import { useActionState } from "react";
import { Button } from "@/modules/shared/components/ui";
import { menuAdminCopy, type MenuFormState } from "../lib/menu-item";
import { deleteMenuItemAction, setAvailabilityAction } from "../server/menu-actions";

/** Sold-out toggle and removal for one item; each gives immediate feedback in its own status line. */
export function MenuItemActions({
  id,
  name,
  available,
}: {
  id: string;
  name: string;
  available: boolean;
}) {
  const [toggle, toggleAction, toggling] = useActionState<MenuFormState, FormData>(
    setAvailabilityAction,
    { status: "idle" },
  );
  const [removal, removeAction, removing] = useActionState<MenuFormState, FormData>(
    deleteMenuItemAction,
    { status: "idle" },
  );
  const message = [toggle, removal].find((state) => state.status === "error");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="available" value={String(!available)} />
          <Button
            type="submit"
            variant={available ? "secondary" : "primary"}
            disabled={toggling}
            aria-busy={toggling}
            aria-label={`${available ? menuAdminCopy.markSoldOut : menuAdminCopy.markAvailable}: ${name}`}
          >
            {available ? menuAdminCopy.markSoldOut : menuAdminCopy.markAvailable}
          </Button>
        </form>
        <form action={removeAction}>
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            variant="ghost"
            disabled={removing}
            aria-busy={removing}
            aria-label={`${menuAdminCopy.remove}: ${name}`}
          >
            {menuAdminCopy.remove}
          </Button>
        </form>
      </div>
      <p role="status" className="text-lg leading-relaxed">
        {message && message.status === "error" ? message.message : ""}
      </p>
    </div>
  );
}
