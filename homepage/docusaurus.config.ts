import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'vibecape',
  tagline: 'SaaS 应用搭建神器 - 让开发者用一行命令就能快速搭建出完整的在线服务系统',
  favicon: 'icon.png',

  // Set the production url of your site here
  url: 'https://vibecape.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'vibe-cli', // Usually your GitHub org/user name.
  projectName: 'vibe', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          breadcrumbs: false,
          editUrl:
            'https://github.com/vibe-cli/vibe/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/vibe-cli/vibe/tree/main/docs/',
          onInlineTags: 'ignore',
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/styles/global.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [],

  themeConfig: {
    image: 'logo.png',
    metadata: [
      {name: 'description', content: 'vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。'},
      {name: 'keywords', content: 'SaaS, CLI, 工具, 快速开发, Next.js, React, TypeScript, 认证, 支付'},
      {property: 'og:title', content: 'vibecape - SaaS 应用搭建神器'},
      {property: 'og:description', content: 'vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。'},
      {property: 'og:image', content: 'https://vibecape.com/logo.png'},
      {property: 'og:url', content: 'https://vibecape.com'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    headTags: [
      {
        tagName: 'script',
        attributes: {
          async: true,
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6224617757558738',
          crossorigin: 'anonymous',
        },
      },
    ],
    navbar: {
          title: 'vibecape',
    logo: {
      alt: 'vibecape Logo',
        src: 'logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '文档',
        },
        {to: '/blog', label: '博客', position: 'left'},
        {
          href: 'https://github.com/vibe-cli/vibe',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '快速开始',
              to: '/docs/guide/getting-started',
            },
            {
              label: '创建项目',
              to: '/docs/guide/creating-project',
            },
            {
              label: '集成指南',
              to: '/docs/integrations',
            },
          ],
        },
        {
          title: '社区',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/vibe-cli/vibe',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/vibe-cli',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/vibe_cli',
            },
          ],
        },
        {
          title: '更多',
          items: [
            {
              label: '博客',
              to: '/blog',
            },
            {
              label: '模板',
              to: '/docs/templates',
            },
            {
              label: '命令参考',
              to: '/docs/reference/commands',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} vibecape Team. Built with Docusaurus.`,
    },
    
    breadcrumbs: false,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
