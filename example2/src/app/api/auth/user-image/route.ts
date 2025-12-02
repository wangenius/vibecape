import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account as accountTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const image = session.user.image || "";
  if (image) {
    return NextResponse.json({ imageUrl: image });
  }

  const rows = await db
    .select()
    .from(accountTable)
    .where(and(eq(accountTable.userId, session.user.id), eq(accountTable.providerId, "github")))
    .limit(1);

  const githubAccountId = rows[0]?.accountId;
  const url = githubAccountId ? `https://avatars.githubusercontent.com/u/${githubAccountId}?v=4` : "";
  return NextResponse.json({ imageUrl: url });
}