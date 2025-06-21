# Vibe CLI 文档

这是 Vibe CLI 的官方文档，使用 VitePress 构建。

## 🚀 本地开发

### 启动开发服务器

```bash
npm run docs:dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看文档。

### 构建文档

```bash
npm run docs:build
```

### 预览构建结果

```bash
npm run docs:preview
```

## 📁 文档结构

```
docs/
├── .vitepress/
│   └── config.mjs          # VitePress 配置
├── public/
│   └── logo.svg            # Logo 文件
├── guide/                  # 使用指南
│   ├── what-is-vibe.md
│   ├── getting-started.md
│   └── creating-project.md
├── reference/              # 参考文档
│   └── commands.md
├── integrations/           # 集成指南
│   ├── index.md
│   └── auth.md
├── templates/              # 模板文档
│   └── index.md
├── index.md                # 首页
└── README.md               # 本文件
```

## ✍️ 贡献文档

### 添加新页面

1. 在相应目录下创建 `.md` 文件
2. 在 `config.mjs` 中添加导航配置
3. 使用 Markdown 语法编写内容

### 文档规范

- 使用中文编写
- 代码块指定语言
- 添加适当的 emoji 和标题
- 包含实际可运行的示例

### 本地测试

在提交前请确保：

```bash
# 启动开发服务器测试
npm run docs:dev

# 构建测试
npm run docs:build
```

## 🌐 部署

文档可以部署到：

- **Vercel**: 连接 GitHub 仓库自动部署
- **Netlify**: 支持自动构建和部署
- **GitHub Pages**: 使用 GitHub Actions

### Vercel 部署配置

```json
{
  "buildCommand": "npm run docs:build",
  "outputDirectory": "docs/.vitepress/dist",
  "installCommand": "npm install"
}
```

### GitHub Actions 配置

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

## 📝 待完善的文档

- [ ] 添加集成指南 - 支付系统
- [ ] 添加集成指南 - 国际化
- [ ] 添加集成指南 - 数据库
- [ ] 添加模板详细说明
- [ ] 添加部署指南
- [ ] 添加故障排除指南
- [ ] 添加 API 参考文档

---

**感谢你为 Vibe CLI 文档做出贡献！** 📚 