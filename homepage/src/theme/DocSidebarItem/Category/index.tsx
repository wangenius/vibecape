import {
  isActiveSidebarItem
} from '@docusaurus/plugin-content-docs/client';
import {
  ThemeClassNames,
  useCollapsible
} from '@docusaurus/theme-common';
import { isSamePath } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/DocSidebarItem/Category';
import DocSidebarItems from '@theme/DocSidebarItems';
import clsx from 'clsx';
import {
  type ReactNode
} from 'react';



export default function DocSidebarItemCategory({
  item,
  onItemClick,
  activePath,
  level,
  index,
}: Props): ReactNode {
  const {items, label, collapsible, className, href} = item;


  const isActive = isActiveSidebarItem(item, activePath);
  return (
    <li
      className={clsx(
        'group my-2',
        className,
      )}
    >
      <div
        className={clsx(
          'relative flex items-center justify-between rounded-md transition-all duration-200 select-none',
        )}
      >

        <div
          className={clsx(
            'relative flex-grow py-2 px-3 text-sm font-medium transition-all duration-200',
            collapsible ? 'text-[0.85rem]' : 'text-[0.8rem]',
         
          )}
        >
          {label}
        </div>
      </div>

      <ul 
        className={clsx(
          "transition-all duration-300 ease-in-out overflow-hidden !pl-2",
          {
            "opacity-90": isActive,
            "opacity-80": !isActive,
          }
        )}
      >
        <div className="transition-all duration-300 opacity-100 py-1">
          <DocSidebarItems
            items={items}
            tabIndex={0}
            onItemClick={onItemClick}
            activePath={activePath}
            level={level + 1}
          />
        </div>
      </ul>
    </li>
  );
}
