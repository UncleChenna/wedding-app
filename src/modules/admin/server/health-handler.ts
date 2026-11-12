import "server-only";
import { connection } from "next/server";
import { currentAdminAccess } from "./current-admin-access";
import { databaseReady, readHealth } from "./health-reader";
import { adminHealthResponse, publicHealthResponse } from "./health-response";
export function getAdminHealth() {
  return adminHealthResponse(currentAdminAccess, readHealth);
}
export async function getPublicHealth() {
  await connection();
  return publicHealthResponse(databaseReady);
}
