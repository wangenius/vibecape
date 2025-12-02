import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
  const headerEntries = Array.from((await headers()).entries());
  const headerInit = Object.fromEntries(headerEntries);
  return auth.api.getSession({ headers: new Headers(headerInit) });
}
