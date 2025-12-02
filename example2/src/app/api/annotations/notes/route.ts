import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comment, note, user } from "@/lib/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "@/lib/server-session";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.searchParams.get("path")?.trim();

  if (!path) {
    return NextResponse.json({ error: "Missing path parameter." }, { status: 400 });
  }

  const noteRows = await db
    .select({
      id: note.id,
      path: note.path,
      selection: note.selection,
      selectorRegex: note.selectorRegex,
      userId: note.userId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(note)
    .leftJoin(user, eq(note.userId, user.id))
    .where(eq(note.path, path))
    .orderBy(desc(note.createdAt));

  const noteIds = noteRows.map((row) => row.id);

  const commentRows =
    noteIds.length > 0
      ? await db
          .select({
            id: comment.id,
            noteId: comment.noteId,
            body: comment.body,
            parentCommentId: comment.parentCommentId,
            userId: comment.userId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            userName: user.name,
            userEmail: user.email,
          })
          .from(comment)
          .leftJoin(user, eq(comment.userId, user.id))
          .where(inArray(comment.noteId, noteIds))
          .orderBy(asc(comment.createdAt))
      : [];

  const notes = noteRows.map((row) => ({
    id: row.id,
    path: row.path,
    selection: row.selection,
    selectorRegex: row.selectorRegex,
    userId: row.userId,
    userName: row.userName ?? null,
    userEmail: row.userEmail ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    comments: commentRows
      .filter((c) => c.noteId === row.id)
      .map((c) => ({
        id: c.id,
        noteId: c.noteId,
        body: c.body,
        parentCommentId: c.parentCommentId,
        userId: c.userId,
        userName: c.userName ?? null,
        userEmail: c.userEmail ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
  }));

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const userSession = await getServerSession();
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { path?: string; selectionText?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const path = payload?.path?.trim();
  const selectionText = payload?.selectionText?.trim();
  const body = payload?.body?.trim();

  if (!path) {
    return NextResponse.json({ error: "Missing document path." }, { status: 400 });
  }

  if (!selectionText) {
    return NextResponse.json({ error: "Missing selection text." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Missing comment body." }, { status: 400 });
  }

  const noteId = uuidv4();
  const commentId = uuidv4();
  const selectorRegex = escapeRegExp(selectionText);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(note).values({
        id: noteId,
        path,
        selection: selectionText,
        selectorRegex,
        userId: userSession.user.id,
      });

      await tx.insert(comment).values({
        id: commentId,
        noteId: noteId,
        body,
        userId: userSession.user.id,
      });
    });
  } catch (error) {
    console.error("Failed to create annotation note:", error);
    return NextResponse.json(
      { error: "Failed to persist the annotation." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, noteId });
}
