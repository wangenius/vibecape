import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vibe CLI',
  description: 'SaaS 应用搭建神器 - 让开发者用一行命令就能快速搭建出完整的在线服务系统',
  lang: 'zh-CN',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '命令参考', link: '/reference/commands' },
      { text: '集成指南', link: '/integrations/' },
      { text: '模板', link: '/templates/' },
      { text: 'GitHub', link: 'https://github.com/vibe-cli/vibe' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '什么是 Vibe CLI', link: '/guide/what-is-vibe' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '创建项目', link: '/guide/creating-project' },
            { text: '添加集成', link: '/guide/adding-integrations' },
            { text: '项目配置', link: '/guide/project-configuration' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '命令行接口', link: '/reference/commands' },
            { text: '配置文件', link: '/reference/config' },
            { text: 'API 参考', link: '/reference/api' }
          ]
        }
      ],
      '/integrations/': [
        {
          text: '集成',
          items: [
            { text: '概述', link: '/integrations/' },
            { text: '用户认证', link: '/integrations/auth' },
            { text: '支付系统', link: '/integrations/payments' },
            { text: '国际化', link: '/integrations/i18n' },
            { text: '数据库', link: '/integrations/database' },
            { text: '邮件服务', link: '/integrations/email' },
            { text: '文件存储', link: '/integrations/storage' },
            { text: '分析监控', link: '/integrations/analytics' }
          ]
        }
      ],
      '/templates/': [
        {
          text: '模板',
          items: [
            { text: '模板概述', link: '/templates/' },
            { text: 'AI SaaS 模板', link: '/templates/ai-saas' },
            { text: '基础 SaaS 模板', link: '/templates/basic-saas' },
            { text: '电商模板', link: '/templates/e-commerce' },
            { text: '自定义模板', link: '/templates/custom' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vibe-cli/vibe' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 Vibe CLI Team'
    },

    editLink: {
      pattern: 'https://github.com/vibe-cli/vibe/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
}) 