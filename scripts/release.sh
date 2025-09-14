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
# Git 远端与分支检测
REMOTE="${REMOTE:-origin}"
ALLOW_NON_MAIN="${ALLOW_NON_MAIN:-false}"

# 根据包名默认生成 tag 前缀（name@），可用 TAG_PREFIX 覆盖
PKG_NAME="$(node -p "require('./package.json').name" 2>/dev/null || echo 'package')"
DEFAULT_TAG_PREFIX="${PKG_NAME}@"
TAG_PREFIX="${TAG_PREFIX:-$DEFAULT_TAG_PREFIX}"

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

prompt_mode() {
  info "请选择发布操作："
  echo "1) 版本号提升并打标签（patch/minor/major）"
  echo "2) 仅为当前版本打标签"
  printf "> 选择 [1/2] (默认 1): "
  IFS= read -r choice || true
  choice=${choice:-1}

  if [[ "$choice" == "2" ]]; then
    tag_current
    return
  fi

  printf "> 选择版本类型 [patch/minor/major] 或输入精确版本 (默认 patch): "
  IFS= read -r rt || true
  rt=${rt:-patch}
  if [[ "$rt" =~ ^(patch|minor|major)$ || "$rt" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    local_release "$rt"
  else
    err "输入无效：$rt"
    exit 1
  fi
}

local_release() {
  local release_type="$1"; shift || true

  # 工作区检查：如有未提交改动，提示用户提交（交互式）
  if ! git diff-index --quiet HEAD --; then
    warn "检测到未提交改动"
    if [ -t 0 ] && [ -t 1 ]; then
      info "按回车直接提交，或输入自定义 commit message 后回车"
      printf "> 提交说明（默认：chore: release prep）: "
      IFS= read -r COMMIT_MSG || true
      COMMIT_MSG=${COMMIT_MSG:-"chore: release prep"}
      info "提交中：${COMMIT_MSG}"
      git add -A
      if git commit -m "${COMMIT_MSG}"; then
        info "已提交工作区改动"
      else
        warn "没有可提交的改动或提交失败，继续发布流程"
      fi
    else
      err "检测到未提交改动，且当前为非交互环境。请先提交后再发布。"
      exit 1
    fi
  fi

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "main" && "$branch" != "master" ]]; then
    if [[ "$ALLOW_NON_MAIN" != "true" ]]; then
      warn "当前分支为 $branch，建议在 main/master 分支发布（可用 ALLOW_NON_MAIN=true 跳过）"
    fi
  fi

  # info "安装依赖"
  # npm i
  # info "构建产物"
  # npm run build

  # 版本升级与打 tag（npm version 会同时提交并打 tag）
  info "版本升级：${release_type} (tag 前缀: ${TAG_PREFIX})"
  npm version "$release_type" \
    --tag-version-prefix "$TAG_PREFIX" \
    -m "chore(release): ${TAG_PREFIX}%s"

  # 读取新版本与将要推送的 tag 名称
  local new_version tag_name
  new_version=$(node -p "require('./package.json').version")
  tag_name="${TAG_PREFIX}${new_version}"

  info "同步远端并推送提交与关联标签"
  git fetch --tags --prune "$REMOTE"
  # --follow-tags 仅推送提交引用到的注解标签，避免推送历史所有标签
  git push --follow-tags "$REMOTE" "HEAD:${branch}"

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

  info "发布完成：${tag_name}"
}

tag_current() {
  # 工作区检查：如有未提交改动，提示用户提交（交互式）
  if ! git diff-index --quiet HEAD --; then
    warn "检测到未提交改动"
    if [ -t 0 ] && [ -t 1 ]; then
      info "按回车直接提交，或输入自定义 commit message 后回车"
      printf "> 提交说明（默认：chore: release prep）: "
      IFS= read -r COMMIT_MSG || true
      COMMIT_MSG=${COMMIT_MSG:-"chore: release prep"}
      info "提交中：${COMMIT_MSG}"
      git add -A
      if git commit -m "${COMMIT_MSG}"; then
        info "已提交工作区改动"
      else
        warn "没有可提交的改动或提交失败，继续发布流程"
      fi
    else
      err "检测到未提交改动，且当前为非交互环境。请先提交后再发布。"
      exit 1
    fi
  fi

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "main" && "$branch" != "master" ]]; then
    if [[ "$ALLOW_NON_MAIN" != "true" ]]; then
      warn "当前分支为 $branch，建议在 main/master 分支发布（可用 ALLOW_NON_MAIN=true 跳过）"
    fi
  fi

  local new_version tag_name
  new_version=$(node -p "require('./package.json').version")
  tag_name="${TAG_PREFIX}${new_version}"

  if git rev-parse -q --verify "refs/tags/${tag_name}" >/dev/null; then
    warn "标签已存在：${tag_name}（跳过创建）"
  else
    info "创建标签：${tag_name}"
    git tag -a "${tag_name}" -m "chore(release): ${tag_name}"
  fi

  info "同步远端并推送提交与关联标签"
  git fetch --tags --prune "$REMOTE"
  git push --follow-tags "$REMOTE" "HEAD:${branch}"

  info "发布完成：${tag_name}"
}

case "$MODE" in
  patch|minor|major)
    local_release "$MODE"
    ;;
  tag|current)
    tag_current
    ;;
  "")
    if [ -t 0 ] && [ -t 1 ]; then
      prompt_mode
    else
      err "用法：bash scripts/release.sh [patch|minor|major|<version>|tag]"
      exit 1
    fi
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
