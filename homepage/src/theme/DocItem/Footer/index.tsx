import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import TagsListInline from "@theme/TagsListInline";
import clsx from "clsx";
import { type ReactNode } from "react";

export default function DocItemFooter(): ReactNode {
  const { metadata } = useDoc();
  const { editUrl, lastUpdatedAt, lastUpdatedBy, tags } = metadata;

  const canDisplayTagsRow = tags.length > 0;
  const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);

  const canDisplayFooter = canDisplayTagsRow || canDisplayEditMetaRow;

  if (!canDisplayFooter) {
    return null;
  }

  return (
    <footer
      className={clsx(ThemeClassNames.docs.docFooter, "docusaurus-mt-lg")}
    >
      {canDisplayTagsRow && (
        <div
          className={clsx(
            "row margin-top--sm",
            ThemeClassNames.docs.docFooterTagsRow
          )}
        >
          <div className="col">
            <TagsListInline tags={tags} />
          </div>
        </div>
      )}
    </footer>
  );
}
