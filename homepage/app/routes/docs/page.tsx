import type { Route } from "./+types/page";
import { source } from "@/lib/source";
import { docs } from "../../../source.generated";
import { toClientRenderer } from "fumadocs-mdx/runtime/vite";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";

export async function loader({ params }: Route.LoaderArgs) {
  const slugs =
    params["*"]?.split("/").filter((v: string) => v.length > 0) ?? [];
  const page = source.getPage(slugs);
  if (!page) throw new Response("Not found", { status: 404 });

  return {
    path: page.path,
    title: page.data.title ?? "Documentation",
    description: page.data.description ?? "",
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  return [
    { title: loaderData.title },
    { name: "description", content: loaderData.description },
  ];
}

const renderer = toClientRenderer(docs.doc, ({ default: Mdx }) => {
  return <Mdx />;
});

export default function Page({ loaderData }: Route.ComponentProps) {
  const { path, title, description } = loaderData;
  const Content = renderer[path];

  return (
    <DocsPage>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <Content />
      </DocsBody>
    </DocsPage>
  );
}
