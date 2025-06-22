import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {HtmlClassNameProvider, ThemeClassNames} from '@docusaurus/theme-common';
import {
  DocsSidebarProvider,
  useDocRootMetadata,
} from '@docusaurus/plugin-content-docs/client';
import DocRootLayout from '@theme/DocRoot/Layout';
import NotFoundContent from '@theme/NotFound/Content';
import type {Props} from '@theme/DocRoot';
import DocRootLayoutSidebar from './Layout/Sidebar';

export default function DocRoot(props: Props): ReactNode {
  const currentDocRouteMetadata = useDocRootMetadata(props);
  if (!currentDocRouteMetadata) {
    // We only render the not found content to avoid a double layout
    // see https://github.com/facebook/docusaurus/pull/7966#pullrequestreview-1077276692
    return <NotFoundContent />;
  }
  const {docElement, sidebarName, sidebarItems} = currentDocRouteMetadata;
  return (
    <HtmlClassNameProvider className={clsx(ThemeClassNames.page.docsDocPage)}>
      <DocsSidebarProvider name={sidebarName} items={sidebarItems}>
        <div className="sm:max-w-7xl md:w-7xl mx-auto flex gap-2">
          {sidebarItems.length > 0 && (
            <DocRootLayoutSidebar sidebar={sidebarItems} hiddenSidebarContainer={false} setHiddenSidebarContainer={() => {}} />
          )}
          <div className="flex-1 min-h-screen sm:max-w-[calc(100%-1rem)] mx-auto p-4">
            {docElement}
          </div>
        </div>
      </DocsSidebarProvider>
    </HtmlClassNameProvider>
  );
}
