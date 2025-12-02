import { source } from "@/lib/source";
import { getDocPreviewSegments, requiresSubscription } from "@/lib/docs-access";
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/page";
import { SelectionQuote } from "@/components/docs/selection-quote";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/mdx-components";
import { PaywallPreview } from "@/components/docs/paywall-preview";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AnnotationHighlights } from "@/components/docs/annotation-highlights";

interface PageParams {
  slug?: string[];
}

export default async function LangDocsPage(props: {
  params: Promise<PageParams>;
}) {
  const { slug } = await props.params;

  const page = source.getPage(slug);
  if (!page) notFound();
  const requestHeaders = await headers();
  const userSession = await auth.api.getSession({ headers: requestHeaders });
  const locked = await requiresSubscription(page, userSession?.user.id);
  const previewSegments = locked ? await getDocPreviewSegments(page, 2) : [];

  const { body: MDXContent, toc } = page.data as any;
  const baseComponents = getMDXComponents({
    a: createRelativeLink(source, page),
  });

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <SelectionQuote>
          <AnnotationHighlights path={page.url}>
            {locked ? (
              <PaywallPreview
                segments={previewSegments}
                components={baseComponents}
              />
            ) : (
              <MDXContent components={baseComponents} />
            )}
          </AnnotationHighlights>
        </SelectionQuote>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
