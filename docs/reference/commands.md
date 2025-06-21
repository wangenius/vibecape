# 命令行接口

Vibe CLI 提供了一套完整的命令行工具，帮助你快速搭建和管理 SaaS 项目。

## 全局选项

所有命令都支持以下全局选项：

```bash
-V, --version     显示版本号
-h, --help        显示帮助信息
--verbose         显示详细日志
--silent          静默模式，不显示输出
```

## `vibe create`

创建新的 SaaS 项目。

### 语法

```bash
vibe create [项目名称] [选项]
```

### 参数

- `项目名称` - 可选，项目的名称。如果不提供，会以交互式方式询问。

### 选项

```bash
-t, --template <template>   指定项目模板
--typescript               启用 TypeScript
--tailwind                 启用 Tailwind CSS
--eslint                   启用 ESLint
--package-manager <pm>     指定包管理器 (npm|yarn|pnpm)
```

### 示例

```bash
# 交互式创建项目
vibe create

# 指定项目名称
vibe create my-saas-app

# 使用特定模板和配置
vibe create my-app --template=ai-saas --typescript --tailwind

# 指定包管理器
vibe create my-app --package-manager=yarn
```

### 可用模板

| 模板名称 | 描述 |
|---------|------|
| `ai-saas` | AI 驱动的 SaaS 应用模板 |
| `basic-saas` | 基础 SaaS 应用模板 |
| `e-commerce` | 电商应用模板 |

## `vibe install`

安装和集成中间件服务。

### 语法

```bash
vibe install [集成类型] [选项]
```

### 参数

- `集成类型` - 可选，要安装的集成类型。如果不提供，会显示可用选项。

### 选项

```bash
-p, --provider <provider>   指定服务提供商
--config <config>          额外配置参数 (JSON 格式)
--skip-install             跳过依赖包安装
--dry-run                  预览模式，不实际执行安装
```

### 支持的集成类型

| 类型 | 描述 | 可用提供商 |
|------|------|-----------|
| `auth` | 用户认证系统 | clerk, nextauth, supabase |
| `payments` | 支付系统 | stripe, paddle, lemonsqueezy |
| `i18n` | 国际化支持 | next-intl, react-i18next |
| `database` | 数据库配置 | supabase, planetscale, neon |
| `email` | 邮件服务 | resend, sendgrid, mailgun |
| `storage` | 文件存储 | cloudinary, s3, supabase |
| `analytics` | 分析监控 | mixpanel, posthog, ga4 |

### 示例

```bash
# 交互式安装认证
vibe install auth

# 指定提供商
vibe install auth --provider=clerk

# 指定配置
vibe install payments --provider=stripe --config='{"subscription":true}'

# 预览模式
vibe install i18n --provider=next-intl --dry-run
```

## `vibe config`

管理项目配置。

### 子命令

#### `vibe config list`

显示当前项目的所有配置。

```bash
vibe config list
```

#### `vibe config get`

获取特定配置项的值。

```bash
vibe config get <键名>
```

**示例：**
```bash
vibe config get project.name
vibe config get settings.typescript
```

#### `vibe config set`

设置配置项的值。

```bash
vibe config set --key=<键名> --value=<值>
```

**选项：**
- `-k, --key <key>` - 配置键名（必需）
- `-v, --value <value>` - 配置值（必需）

**示例：**
```bash
vibe config set --key=settings.packageManager --value=yarn
vibe config set --key=project.description --value="我的 SaaS 项目"
```

## `vibe health`

检查项目健康状态。

### 语法

```bash
vibe health [选项]
```

### 选项

```bash
--fix                 自动修复可修复的问题
--report              生成详细的健康报告
```

### 检查项目

- Node.js 版本兼容性
- package.json 文件存在性
- Vibe 配置文件完整性
- Git 仓库状态
- 依赖包安装情况
- 环境变量配置
- 集成服务状态

### 示例

```bash
# 基础健康检查
vibe health

# 自动修复问题
vibe health --fix

# 生成详细报告
vibe health --report
```

## `vibe templates`

管理项目模板。

### 子命令

#### `vibe templates list`

显示所有可用的项目模板。

```bash
vibe templates list
```

#### `vibe templates info`

显示特定模板的详细信息。

```bash
vibe templates info <模板名称>
```

**示例：**
```bash
vibe templates info ai-saas
```

## `vibe update`

更新已安装的中间件。

### 语法

```bash
vibe update [集成名称] [选项]
```

### 参数

- `集成名称` - 可选，要更新的集成名称。如果不提供，需要使用 `--all` 选项。

### 选项

```bash
--all                 更新所有已安装的集成
--check               只检查更新，不实际执行
--force               强制更新，即使版本相同
```

### 示例

```bash
# 更新特定集成
vibe update auth

# 更新所有集成
vibe update --all

# 检查更新
vibe update --check

# 强制更新
vibe update auth --force
```

## `vibe revise`

修正和优化项目结构。

### 语法

```bash
vibe revise [选项]
```

### 选项

```bash
--fix-structure       修复项目结构问题
--optimize            优化项目配置
--update-deps         更新依赖版本
--format              格式化代码
```

### 示例

```bash
# 基础项目修正
vibe revise

# 修复结构问题
vibe revise --fix-structure

# 完整优化
vibe revise --fix-structure --optimize --format
```

## 环境变量

Vibe CLI 支持以下环境变量：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `VIBE_REGISTRY` | 模板和集成的注册表 URL | 官方注册表 |
| `VIBE_CACHE_DIR` | 缓存目录 | `~/.vibe/cache` |
| `VIBE_CONFIG_DIR` | 配置目录 | `~/.vibe/config` |
| `VIBE_LOG_LEVEL` | 日志级别 | `info` |

## 配置文件

### `vibe.config.json`

项目级别的配置文件，包含项目元信息和集成配置：

```json
{
  "project": {
    "name": "my-saas-app",
    "version": "1.0.0",
    "template": "ai-saas"
  },
  "integrations": {
    "auth": {
      "provider": "clerk",
      "version": "6.16.0",
      "config": {
        "socialLogin": true
      }
    }
  },
  "settings": {
    "packageManager": "npm",
    "typescript": true,
    "tailwind": true,
    "eslint": true
  }
}
```

### 全局配置

全局配置存储在 `~/.vibe/config.json`：

```json
{
  "defaultTemplate": "basic-saas",
  "defaultPackageManager": "npm",
  "autoUpdate": true,
  "telemetry": true
}
```

## 退出代码

| 代码 | 含义 |
|------|------|
| 0 | 成功 |
| 1 | 一般错误 |
| 2 | 参数错误 |
| 3 | 配置错误 |
| 4 | 网络错误 |
| 5 | 权限错误 |

## 故障排除

### 常见问题

**命令找不到**
```bash
# 确保 CLI 已正确安装
npm list -g vibe-cli

# 重新安装
npm install -g vibe-cli
```

**权限错误**
```bash
# macOS/Linux 使用 sudo
sudo npm install -g vibe-cli

# 或配置 npm 全局目录
npm config set prefix ~/.npm-global
```

**网络问题**
```bash
# 使用国内镜像
npm install -g vibe-cli --registry=https://registry.npmmirror.com
```

### 调试模式

启用详细日志查看详细信息：

```bash
vibe create my-app --verbose
```

### 获取帮助

- 查看命令帮助：`vibe <command> --help`
- 提交问题：[GitHub Issues](https://github.com/vibe-cli/vibe/issues)
- 社区讨论：[GitHub Discussions](https://github.com/vibe-cli/vibe/discussions) 