import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/lib/source";
import { createMetadata } from "@/lib/metadata";
import { Control } from "@/app/(home)/blog/[slug]/page.client";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = products.getPage([params.slug]);

  if (!page) notFound();
  const data = page.data as any;
  const { body: Mdx } = await data.load();

  return (
    <article className="flex flex-col mx-auto flex-1 max-w-fd-container py-8 lg:flex-row px-8">
      <div className="prose min-w-0 flex-1 p-4 py-12 overflow-auto">
        <Mdx components={getMDXComponents()} />
      </div>
      <div className="flex flex-col gap-4 border-l p-4 text-sm lg:w-[250px]">
        <div>
          <p className="mb-1 text-fd-muted-foreground">Written by</p>
          <p className="font-medium">{data.author ?? "Unknown"}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-fd-muted-foreground">At</p>
          <p className="font-medium">
            {data.date
              ? new Date(data.date).toDateString()
              : "Date to be announced"}
          </p>
        </div>
        <Control url={page.url} />
      </div>
    </article>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = products.getPage([params.slug]);

  if (!page) notFound();

  return createMetadata({
    title: page.data.title,
    description:
      page.data.description ?? "The library for building documentation sites",
  });
}
