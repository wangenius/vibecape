import React, {type ReactNode, useState} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';

import styles from './styles.module.css';

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'group relative my-1',
        level > 1 ? 'ml-1.5' : '',
        className,
      )}
      key={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={clsx(
        'relative block rounded-md transition-all duration-200',
        {
          'bg-accent/10': isActive,
          'hover:bg-accent/5': !isActive && isHovered,
        }
      )}>
        {/* 活跃指示器 */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary rounded-r-md transition-all duration-300" />
        )}
        
        <Link
          className={clsx(
            'menu__link relative flex items-center justify-between w-full py-2 px-3 transition-all duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary',
            'text-[0.75rem] font-normal',
            {
              'pl-4': isActive && level === 1
            }
          )}
          autoAddBaseUrl={autoAddBaseUrl}
          aria-current={isActive ? 'page' : undefined}
          to={href}
          {...(isInternalLink && {
            onClick: onItemClick ? () => onItemClick(item) : undefined,
          })}
          {...props}
        >
          <span className="truncate">{label}</span>
          
          {!isInternalLink && (
            <span className={clsx(
              'flex items-center transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-60'
            )}>
              <IconExternalLink />
            </span>
          )}
        </Link>
      </div>
    </li>
  );
}
