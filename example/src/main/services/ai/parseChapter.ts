import { streamText } from "ai";
import { Model } from "../Model";

import { getCosmosDb } from "@main/db/cosmos";
import { cosmosManager } from "@main/utils/CosmosManager";
import { stories } from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { chapters } from "@common/schema/novel";

export interface ParseChapterSinglePayload {
  chapterIds: string[];
  extra?: string;
  modelHint?: string;
}

export interface ParseChaptersAsOnePayload {
  chapterIds: string[];
  extra?: string;
  modelHint?: string;
}

export interface ParseChaptersRandomPayload {
  chapterIds: string[];
  extra?: string;
  modelHint?: string;
}

async function createStoryRecord(
  db: any,
  initial: { name: string }
) {
  const id = nanoid();
  await db
    .insert(stories)
    .values({
      id,
      name: initial.name,
      body: "[]",
      parent_id: "",
      order_index: 0,
      cover: "",
      position_x: 0,
      position_y: 0,
      last_ids: "[]",
      next_ids: "[]",
    })
    .run();
  return id;
}

async function updateStoryBody(db: any, id: string, bodyJson: string) {
  await db
    .update(stories)
    .set({ body: bodyJson, updated_at: Date.now() })
    .where(eq(stories.id, id))
    .run();
}

async function linkChapterToStory(db: any, chapterId: string, storyId: string) {
  await db
    .update(chapters)
    .set({ story_id: storyId, updated_at: Date.now() })
    .where(eq(chapters.id, chapterId))
    .run();
}

export async function runParseChapterSingle(
  payload: ParseChapterSinglePayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  try {
    const modelInstance = await Model.get();
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);

    for (const chapterId of payload.chapterIds) {
      const ch = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .get();
      if (!ch) continue;

      const storyId = await createStoryRecord(db, { name: ch.name });
      await linkChapterToStory(db, chapterId, storyId);

      // 生成正文
      const systemBody = `- Role: 专业小说编辑和内容提炼专家\n- Goals: 将章节内容转化为精炼生动的叙述正文（细纲化正文）\n- Constraints: 基于原文；500-1000字；不使用标题/Markdown；分段自然。`;
      const userBody = `请根据以下章节内容，提取核心要素并生成精炼叙述：\n${ch.body}`;

      let accumulated = "";
      const resBody = streamText({
        model: modelInstance,
        messages: [
          { role: "system" as const, content: systemBody },
          { role: "user" as const, content: userBody },
        ],
        abortSignal: opts.abortSignal,
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            accumulated += chunk.text;
            opts.onText(chunk.text);
          }
        },
        onFinish: async () => {
          // 将纯文本保存为 Slate JSON 数组的字符串占位格式（前端已有合并逻辑，这里存为单段）
          const bodyJson = JSON.stringify([
            { type: "paragraph", children: [{ text: accumulated }] },
          ]);
          await updateStoryBody(db, storyId, bodyJson);
        },
        onError: ({ error }) => {
          const msg =
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : "生成失败";
          opts.onError(msg);
        },
      });
      await resBody.consumeStream();
    }

    opts.onEnd();
  } catch (err: any) {
    opts.onError(err?.message || "解析章节失败");
  }
}

export async function runParseChaptersAsOne(
  payload: ParseChaptersAsOnePayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  try {
    const modelInstance = await Model.get();
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);

    const chs = await Promise.all(
      payload.chapterIds.map(async (id) =>
        db.select().from(chapters).where(eq(chapters.id, id)).get()
      )
    );
    const contents = chs
      .filter(Boolean)
      .map((c: any) => c.body)
      .join("\n");

    const storyId = await createStoryRecord(db, { name: "AI解析章节" });

    let accumulated = "";
    const resBody = streamText({
      model: modelInstance,
      messages: [
        {
          role: "system" as const,
          content: `- Role: 小说编辑\n- Goals: 将多章节内容融合为一体的精炼叙述正文（细纲化正文）`,
        },
        { role: "user" as const, content: contents },
      ],
      abortSignal: opts.abortSignal,
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") {
          accumulated += chunk.text;
          opts.onText(chunk.text);
        }
      },
      onFinish: async () => {
        const bodyJson = JSON.stringify([
          { type: "paragraph", children: [{ text: accumulated }] },
        ]);
        await updateStoryBody(db, storyId, bodyJson);
      },
      onError: ({ error }) => {
        const msg =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "生成失败";
        opts.onError(msg);
      },
    });
    await resBody.consumeStream();

    // 关联所有章节到该故事
    for (const ch of chs.filter(Boolean)) {
      await linkChapterToStory(db, (ch as any).id, storyId);
    }

    opts.onEnd();
  } catch (err: any) {
    opts.onError(err?.message || "解析章节失败");
  }
}

export async function runParseChaptersRandom(
  payload: ParseChaptersRandomPayload,
  opts: {
    onText: (t: string) => void;
    onEnd: () => void;
    onError: (m: string) => void;
    abortSignal?: AbortSignal;
  }
) {
  try {
    const modelInstance = await Model.get();
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);

    const chs = await Promise.all(
      payload.chapterIds.map(async (id) =>
        db.select().from(chapters).where(eq(chapters.id, id)).get()
      )
    );
    const contents = chs
      .filter(Boolean)
      .map((c: any) => c.body)
      .join("\n");

    // 先产出结构化的剧情流（名称+关系）
    let jsonText = "";
    const resPlan = streamText({
      model: modelInstance,
      messages: [
        {
          role: "system" as const,
          content: `- Role: 文学家\n- Goals: 基于内容输出若干情节节点的JSON，含last/next`,
        },
        { role: "user" as const, content: contents },
      ],
      abortSignal: opts.abortSignal,
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") jsonText += chunk.text;
      },
      onFinish: () => {},
      onError: ({ error }) => {
        const msg =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "生成失败";
        opts.onError(msg);
      },
    });
    await resPlan.consumeStream();

    let plan: Record<
      string,
      { last?: string[]; next?: string[] }
    >;
    try {
      plan = JSON.parse(jsonText);
    } catch {
      plan = {} as any;
    }

    // 创建故事并建立关系
    const nameToId = new Map<string, string>();
    for (const [name] of Object.entries(plan)) {
      const id = await createStoryRecord(db, { name });
      nameToId.set(name, id);
    }

    // 逐个生成正文并保存
    for (const [name] of Object.entries(plan)) {
      const id = nameToId.get(name)!;
      let accumulated = "";
      const resBody = streamText({
        model: modelInstance,
        messages: [
          {
            role: "system" as const,
            content: `- Role: 小说编辑\n- Goals: 基于选中情节生成对应的细纲化正文`,
          },
          { role: "user" as const, content: contents },
        ],
        abortSignal: opts.abortSignal,
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            accumulated += chunk.text;
            opts.onText(chunk.text);
          }
        },
        onFinish: async () => {
          const bodyJson = JSON.stringify([
            { type: "paragraph", children: [{ text: accumulated }] },
          ]);
          await updateStoryBody(db, id, bodyJson);
        },
        onError: ({ error }) => {
          const msg =
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : "生成失败";
          opts.onError(msg);
        },
      });
      await resBody.consumeStream();
    }

    opts.onEnd();
  } catch (err: any) {
    opts.onError(err?.message || "解析章节失败");
  }
}
