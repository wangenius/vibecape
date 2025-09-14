#!/usr/bin/env bash
set -euo pipefail

# 说明：
# 本地发布（版本升级 + 打 tag + 推送）。默认不直接 npm 发布，由 GitHub Actions 触发自动发布。
# 用法：bash scripts/release.sh [patch|minor|major|<version>]
# 可选：PUBLISH=true 本地直接 npm 发布（一般不需要）
# 可选：NPM_TOKEN=<your_token> 用于自动登录（否则使用已登录状态）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLI_DIR="${REPO_ROOT}/package"

# 进入 CLI 包目录，确保 npm version/publish 作用在正确的 package.json 上
cd "$CLI_DIR"

color() { local c=$1; shift; printf "\033[%sm%s\033[0m\n" "$c" "$*"; }
info() { color 36 "[INFO] $*"; }
warn() { color 33 "[WARN] $*"; }
err()  { color 31 "[ERR ] $*"; }

MODE="${1:-}"
# 可覆盖：用于 npm 打 tag 的前缀（默认使用包名约定），例如 vibecape@1.2.3
TAG_PREFIX="${TAG_PREFIX:-vibecape@}"

# 安全检查：确保 node 和 npm 可用
command -v node >/dev/null 2>&1 || { err "需要 Node.js"; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "需要 npm"; exit 1; }

setup_npm_auth() {
  if [[ -n "${NPM_TOKEN:-}" ]]; then
    info "配置 npm token"
    npm config set "//registry.npmjs.org/:_authToken" "$NPM_TOKEN" >/dev/null 2>&1 || true
  else
    warn "未检测到 NPM_TOKEN，使用当前登录状态"
  fi
}

local_release() {
  local release_type="$1"; shift || true

  # 工作区检查
  if ! git diff-index --quiet HEAD --; then
    err "当前工作区有未提交改动，请先提交或清理后再发布"
    exit 1
  fi

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "main" && "$branch" != "master" ]]; then
    warn "当前分支为 $branch，建议在 main/master 分支进行发布"
  fi

  # info "安装依赖"
  # npm i
  # info "构建产物"
  # npm run build

  # 版本升级与打 tag（npm version 会同时提交并打 tag）
  info "版本升级：$release_type（tag 前缀：$TAG_PREFIX）"
  npm version "$release_type" \
    --tag-version-prefix "$TAG_PREFIX" \
    -m "chore(release): ${TAG_PREFIX}%s"

  info "同步远端并推送提交与标签"
  git fetch --tags --prune
  git push
  git push --tags

  # npm 发布（默认关闭，由 CI 处理）
  if [[ "${PUBLISH:-false}" == "true" ]]; then
    setup_npm_auth
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
      info "发布到 npm（dry-run）"
      npm publish --dry-run --access public || true
    else
      info "发布到 npm"
      npm publish --access public
    fi
  else
    warn "已跳过 npm publish（PUBLISH=false）"
  fi

  local new_version
  new_version=$(node -p "require('./package.json').version")
  info "发布完成：v${new_version}"
}

case "$MODE" in
  patch|minor|major)
    local_release "$MODE"
    ;;
  "")
    err "用法：bash scripts/release.sh [patch|minor|major|<version>]"
    exit 1
    ;;
  *)
    # 指定明确版本号，如 1.2.3
    if [[ "$MODE" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
      local_release "$MODE"
    else
      err "无效参数：$MODE"
      err "用法：bash scripts/release.sh [patch|minor|major|<version>]"
      exit 1
    fi
    ;;
esac
