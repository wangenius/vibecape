import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'introduction',
    {
      type: 'category',
      label: '指南',
      items: [
        'guide/getting-started',
        'guide/creating-project',
      ],
    },
    {
      type: 'category',
      label: '集成指南',
      items: [
        'integrations/index',
        'integrations/auth',
      ],
    },
    {
      type: 'category',
      label: '参考文档',
      items: [
        'reference/commands',
      ],
    },
    {
      type: 'category',
      label: '项目模板',
      items: [
        'templates/index',
      ],
    },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
