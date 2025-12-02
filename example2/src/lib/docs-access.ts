import { readFile } from "node:fs/promises";
import { createCompiler } from "@fumadocs/mdx-remote";
import type { MdxContent } from "@fumadocs/mdx-remote/client";
import { source } from "@/lib/source";
import { hasActiveSubscription } from "@/lib/subscription";

type DocPage =
  | (NonNullable<ReturnType<typeof source.getPage>> & {
      data: { free?: boolean };
    })
  | undefined;

export function isDocFree(page?: DocPage): boolean {
  return Boolean(page && page.data?.free);
}

export async function requiresSubscription(
  page?: DocPage,
  userId?: string
): Promise<boolean> {
  if (!page) return false;
  if (isDocFree(page)) return false;
  if (userId && (await hasActiveSubscription(userId))) {
    return false;
  }
  return true;
}

const FRONTMATTER_REGEX = /^---[\r\n]+[\s\S]*?[\r\n]+---/;
const previewCompiler = createCompiler({
  preset: "fumadocs",
});

export async function getDocPreviewSegments(
  page?: DocPage,
  limit = 2
): Promise<MdxContent[]> {
  const filePath =
    (page as { absolutePath?: string } | undefined)?.absolutePath ??
    page?.absolutePath;

  if (!filePath) return [];

  try {
    const raw = await readFile(filePath, "utf-8");
    const content = raw.replace(FRONTMATTER_REGEX, "").trim();

    const segments = content
      .split(/\r?\n\s*\r?\n/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const trimmedSegments = segments.slice(0, limit);

    const compiledSegments = await Promise.all(
      trimmedSegments.map(async (segment, index) => {
        const { body } = await previewCompiler.compile({
          source: segment,
          filePath: `${filePath}#preview-${index + 1}`,
        });

        return body;
      })
    );

    return compiledSegments;
  } catch (error) {
    console.error("Failed to build preview content:", error);
    return [];
  }
}

/**
 * 根据 /docs/... 路径获取文档原始内容（去掉 frontmatter）
 */
export async function getDocFullContentByPath(docPath: string): Promise<string | null> {
  try {
    const normalized = docPath.replace(/^https?:\/\/[^/]+/, "");
    const withoutBase = normalized.replace(/^\/docs\/?/, "");
    const slug = withoutBase.split("/").filter(Boolean);

    const page = source.getPage(slug.length ? slug : undefined);
    const filePath =
      (page as { absolutePath?: string } | undefined)?.absolutePath ??
      page?.absolutePath;

    if (!filePath) return null;

    const raw = await readFile(filePath, "utf-8");
    const content = raw.replace(FRONTMATTER_REGEX, "").trim();
    return content;
  } catch (error) {
    console.error("Failed to load full doc content:", error);
    return null;
  }
}
