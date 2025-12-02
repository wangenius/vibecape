import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comment, note } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "@/lib/server-session";

export async function POST(request: Request) {
  const userSession = await getServerSession();
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    noteId?: string;
    parentCommentId?: string | null;
    body?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const noteId = payload?.noteId?.trim();
  const parentCommentId = payload?.parentCommentId?.trim() || null;
  const body = payload?.body?.trim();

  if (!noteId) {
    return NextResponse.json({ error: "Missing note ID." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Missing comment body." }, { status: 400 });
  }

  const noteRecord = await db
    .select({ id: note.id })
    .from(note)
    .where(eq(note.id, noteId))
    .limit(1);

  if (noteRecord.length === 0) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  if (parentCommentId) {
    const parentRecord = await db
      .select({ id: comment.id, noteId: comment.noteId })
      .from(comment)
      .where(eq(comment.id, parentCommentId))
      .limit(1);

    if (parentRecord.length === 0) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    }

    if (parentRecord[0].noteId !== noteId) {
      return NextResponse.json(
        { error: "Reply must belong to the same note." },
        { status: 400 }
      );
    }
  }

  const commentId = uuidv4();

  try {
    await db.insert(comment).values({
      id: commentId,
      noteId,
      body,
      parentCommentId,
      userId: userSession.user.id,
    });
  } catch (error) {
    console.error("Failed to insert comment:", error);
    return NextResponse.json(
      { error: "Failed to persist the comment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, commentId });
}

export async function DELETE(request: Request) {
  const userSession = await getServerSession();
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { commentId?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const commentId = payload?.commentId?.trim();
  if (!commentId) {
    return NextResponse.json({ error: "Missing comment ID." }, { status: 400 });
  }

  const existing = await db
    .select({ id: comment.id, userId: comment.userId })
    .from(comment)
    .where(eq(comment.id, commentId))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  if (existing[0].userId !== userSession.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await db.delete(comment).where(eq(comment.id, commentId));
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete the comment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
