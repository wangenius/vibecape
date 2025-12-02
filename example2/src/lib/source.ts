import { docs, blog, product } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx/runtime/next";

export const docsI18nConfig = {
  parser: "dir" as const,
};

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export const blogs = loader({
  baseUrl: "/blog",
  source: createMDXSource(blog),
});

export const products = loader({
  baseUrl: "/products",
  source: createMDXSource(product),
});
