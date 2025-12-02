import { z } from "zod";
import { readFile } from "node:fs/promises";
import { getDocFullContentByPath } from "@/lib/docs-access";
import { blogs, products, source } from "@/lib/source";
import { tool } from "ai";
import { initAdvancedSearch } from "fumadocs-core/search/server";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import type { StructuredData } from "fumadocs-core/mdx-plugins";

const FRONTMATTER_REGEX = /^---[\r\n]+[\s\S]*?[\r\n]+---/;

const emptyStructuredData: StructuredData = {
  headings: [],
  contents: [],
};

const advancedSearch = initAdvancedSearch({
  indexes: source.getPages().map((page) => ({
    id: page.url,
    title: page.data.title || "",
    description: page.data.description || "",
    url: page.url,
    structuredData: emptyStructuredData,
  })),
  components: {
    tokenizer: createTokenizer(),
  },
});

const getTimestamp = (value?: string | Date) =>
  value ? new Date(value).getTime() : 0;

const toIsoString = (value?: string | Date) =>
  value ? new Date(value).toISOString() : null;

export const get_doc_content = tool({
  description:
    "根据 /docs/... 路径获取对应文档的完整原始内容，用于回答与该文档直接相关的问题。",
  inputSchema: z.object({
    path: z.string().describe("文档路径，例如 /docs/anthropocene/example"),
  }),
  execute: async (input) => {
    try {
      const { path } = input;
      const content = await getDocFullContentByPath(path);
      if (!content) {
        return {
          error: "Document not found",
        } as const;
      }
      return {
        path,
        content,
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const search = tool({
  description:
    "使用站点内置的 Orama 高级搜索（基于 fumadocs source），按关键字搜索文档内容，返回结构化搜索结果。",
  inputSchema: z.object({
    query: z.string().describe("搜索关键字，例如 'subscription' 或 'BayBar'"),
    locale: z
      .string()
      .optional()
      .describe("可选，语言/locale，例如 'en'，会传给搜索引擎"),
    tag: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe("可选，搜索标签（单个或多个），用于过滤搜索结果"),
  }),
  execute: async (input) => {
    try {
      const { query, locale, tag } = input;

      const result = await advancedSearch.search(query, {
        locale,
        tag,
      } as any);

      return {
        query,
        ...result,
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const get_docs_tree = tool({
  description:
    "获取 /docs 下的文档树形结构和路径信息，可选指定语言（默认为 en）用于快速浏览文档结构。",
  inputSchema: z.object({
    lang: z
      .string()
      .optional()
      .describe("文档语言，例如 en 或 zh，不传则默认 en"),
  }),
  execute: async (input) => {
    try {
      const lang = input?.lang ?? "en";
      const tree = source.getPageTree(lang);

      const simplify = (node: any): any => ({
        title: node.data?.title ?? node.name,
        name: node.name,
        url: node.url,
        slugs: node.slugs,
        children: Array.isArray(node.children)
          ? node.children.map((child: any) => simplify(child))
          : [],
      });

      const simplified = Array.isArray(tree)
        ? tree.map((n: any) => simplify(n))
        : simplify(tree as any);

      return {
        lang,
        tree: simplified,
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const get_blog_list = tool({
  description:
    "获取 blog 下所有文章的简要列表和路径信息，包括 slug、url、标题、描述和日期。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const posts = [...blogs.getPages()].sort(
        (a, b) => getTimestamp(b.data.date) - getTimestamp(a.data.date)
      );

      return {
        posts: posts.map((post) => ({
          slug: post.slugs?.[0],
          url: post.url,
          title: post.data.title,
          description: post.data.description ?? null,
          date: toIsoString(post.data.date),
        })),
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const get_blog_content = tool({
  description:
    "根据 blog 的 slug 获取对应文章的元信息和完整原始内容（去掉 frontmatter）。",
  inputSchema: z.object({
    slug: z.string().describe("blog 的 slug，例如 gorilla-game"),
  }),
  execute: async (input) => {
    try {
      const { slug } = input;
      const page = blogs.getPage([slug]);

      if (!page) {
        return {
          error: "Blog post not found",
        } as const;
      }

      const filePath = page.absolutePath;

      if (!filePath) {
        return {
          error: "Blog file path not available",
        } as const;
      }

      const raw = await readFile(filePath, "utf-8");
      const content = raw.replace(FRONTMATTER_REGEX, "").trim();

      return {
        slug,
        url: page.url,
        meta: page.data,
        content,
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const get_products_list = tool({
  description:
    "获取 products 下所有产品页面的简要列表和路径信息，包括 slug、url、标题和描述。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const items = [...products.getPages()];

      return {
        products: items.map((item) => ({
          slug: item.slugs?.[0],
          url: item.url,
          title: item.data.title,
          description: item.data.description ?? null,
        })),
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});

export const get_product_content = tool({
  description:
    "根据 product 的 slug 获取对应产品页面的元信息和完整原始内容（去掉 frontmatter）。",
  inputSchema: z.object({
    slug: z.string().describe("product 的 slug，例如 arch_portfolio"),
  }),
  execute: async (input) => {
    try {
      const { slug } = input;
      const page = products.getPage([slug]);

      if (!page) {
        return {
          error: "Product not found",
        } as const;
      }

      const filePath = page.absolutePath;

      if (!filePath) {
        return {
          error: "Product file path not available",
        } as const;
      }

      const raw = await readFile(filePath, "utf-8");
      const content = raw.replace(FRONTMATTER_REGEX, "").trim();

      return {
        slug,
        url: page.url,
        meta: page.data,
        content,
      } as const;
    } catch (error: any) {
      return {
        error: error.message,
      } as const;
    }
  },
});
