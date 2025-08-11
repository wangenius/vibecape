#!/usr/bin/env bash

set -euo pipefail

APP_NAME="vibecape"
CLI_BIN="vibe"
REQUIRED_NODE_MAJOR=16

info() { printf "\033[1;34m[信息]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[警告]\033[0m %s\n" "$*"; }
error() { printf "\033[1;31m[错误]\033[0m %s\n" "$*"; }

detect_os() {
  local os arch
  os=$(uname -s 2>/dev/null || echo unknown)
  arch=$(uname -m 2>/dev/null || echo unknown)
  echo "$os" "$arch"
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

ensure_curl() {
  if ! have_cmd curl; then
    warn "未检测到 curl，尝试安装..."
    if have_cmd brew; then
      brew install curl
    elif have_cmd apt-get; then
      sudo apt-get update -y && sudo apt-get install -y curl ca-certificates
    elif have_cmd dnf; then
      sudo dnf install -y curl ca-certificates
    elif have_cmd yum; then
      sudo yum install -y curl ca-certificates
    elif have_cmd pacman; then
      sudo pacman -Sy --noconfirm curl ca-certificates
    else
      error "无法自动安装 curl，请手动安装后重试。"
      exit 1
    fi
  fi
}

node_major_version() {
  if have_cmd node; then
    node -v | sed -E 's/^v([0-9]+).*/\1/'
  else
    echo 0
  fi
}

install_node_with_nvm() {
  info "使用 nvm 安装 Node.js (LTS)..."
  ensure_curl
  local NVM_DIR
  NVM_DIR="$HOME/.nvm"
  export NVM_DIR
  if [ ! -d "$NVM_DIR" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck disable=SC1090
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  # shellcheck disable=SC1090
  [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
  nvm install --lts
  nvm use --lts
}

ensure_node() {
  local major
  major=$(node_major_version)
  if [ "$major" -ge "$REQUIRED_NODE_MAJOR" ]; then
    info "已检测到 Node.js (>=${REQUIRED_NODE_MAJOR})."
    return 0
  fi

  warn "未检测到满足要求的 Node.js (需要 >= ${REQUIRED_NODE_MAJOR})." \
       "将尝试自动安装。"

  read -r os arch < <(detect_os)
  case "$os" in
    Darwin|Linux)
      # 优先使用 nvm，若失败再尝试包管理器
      if install_node_with_nvm; then
        return 0
      fi
      warn "nvm 安装失败，尝试系统包管理器安装。"
      if [ "$os" = "Darwin" ] && have_cmd brew; then
        brew update && brew install node
      elif have_cmd apt-get; then
        sudo apt-get update -y && sudo apt-get install -y nodejs npm
      elif have_cmd dnf; then
        sudo dnf install -y nodejs npm
      elif have_cmd yum; then
        sudo yum install -y nodejs npm
      elif have_cmd pacman; then
        sudo pacman -Sy --noconfirm nodejs npm
      else
        error "未找到合适的包管理器，请手动安装 Node.js >= ${REQUIRED_NODE_MAJOR} 后重试。"
        exit 1
      fi
      ;;
    *)
      error "不支持的系统: $os ($arch)。请手动安装 Node.js >= ${REQUIRED_NODE_MAJOR} 并重试。"
      exit 1
      ;;
  esac

  major=$(node_major_version)
  if [ "$major" -lt "$REQUIRED_NODE_MAJOR" ]; then
    error "Node.js 版本仍低于要求 (检测到: $major, 需要: ${REQUIRED_NODE_MAJOR}+)."
    exit 1
  fi
}

try_npm_global_install() {
  local pkg="${APP_NAME}"
  local tag=${VIBECAPE_NPM_DIST_TAG:-}
  if [ -n "$tag" ]; then
    pkg="${pkg}@${tag}"
  fi

  if have_cmd npm; then
    info "使用 npm 全局安装 ${APP_NAME}..."
    if npm install -g "$pkg"; then
      return 0
    fi
    if [ "${EUID:-$(id -u)}" -ne 0 ] && have_cmd sudo; then
      warn "无权限全局安装，尝试使用 sudo..."
      if sudo npm install -g "$pkg"; then
        return 0
      fi
    fi
    warn "npm 全局安装失败。"
  fi
  return 1
}

try_pnpm_global_install() {
  local pkg="${APP_NAME}"
  local tag=${VIBECAPE_NPM_DIST_TAG:-}
  if [ -n "$tag" ]; then
    pkg="${pkg}@${tag}"
  fi
  if have_cmd pnpm; then
    info "使用 pnpm 全局安装 ${APP_NAME}..."
    pnpm add -g "$pkg" && return 0 || warn "pnpm 全局安装失败。"
  fi
  return 1
}

try_yarn_global_install() {
  local pkg="${APP_NAME}"
  local tag=${VIBECAPE_NPM_DIST_TAG:-}
  if [ -n "$tag" ]; then
    pkg="${pkg}@${tag}"
  fi
  if have_cmd yarn; then
    info "使用 yarn 全局安装 ${APP_NAME}..."
    yarn global add "$pkg" && return 0 || warn "yarn 全局安装失败。"
  fi
  return 1
}

ensure_cli_installed() {
  if have_cmd "$CLI_BIN"; then
    info "已检测到 ${CLI_BIN}，跳过安装。"
    return 0
  fi

  info "开始安装 ${APP_NAME} CLI..."
  if try_npm_global_install; then
    :
  elif try_pnpm_global_install; then
    :
  elif try_yarn_global_install; then
    :
  else
    error "未找到可用的包管理器 (npm/pnpm/yarn) 或安装失败。"
    echo "提示：您可以手动执行以下任意命令进行安装："
    echo "  npm install -g ${APP_NAME}"
    echo "  pnpm add -g ${APP_NAME}"
    echo "  yarn global add ${APP_NAME}"
    exit 1
  fi
}

post_check() {
  if ! have_cmd "$CLI_BIN"; then
    error "安装似乎未成功，未找到命令: ${CLI_BIN}。"
    exit 1
  fi
  local ver
  if ver=$("$CLI_BIN" --version 2>/dev/null); then
    info "安装成功: ${CLI_BIN} ${ver}"
  else
    info "安装成功: 已找到 ${CLI_BIN}"
  fi
}

main() {
  info "开始安装 ${APP_NAME} CLI"
  read -r os arch < <(detect_os)
  info "系统: ${os} 架构: ${arch}"
  ensure_node
  ensure_cli_installed
  post_check

  cat <<'EOM'

下一步建议：
  - 运行 `vibe --help` 查看可用命令
  - 快速开始：
      vibe create my-app

环境变量：
  - 使用 `VIBECAPE_NPM_DIST_TAG` 可安装指定 npm 发布通道（如 beta、next），例如：
      VIBECAPE_NPM_DIST_TAG=next curl -fsSL https://vibecape.com/install.sh | bash

感谢使用 Vibecape 🎉
EOM
}

main "$@"


