export type AdminAuthState = {
  status: "idle" | "code-sent" | "signed-in" | "signed-out" | "error";
  message: string;
  email?: string;
};
export const initialAdminAuthState: AdminAuthState = { status: "idle", message: "" };
