#!/bin/bash

set -e


cp .env.example .env
echo ".env 文件已复制"


# 2. 安装 npm 依赖
echo "正在安装 npm 依赖..."
npm install

echo "npm 依赖安装完成"
# 3. 初始化数据库（如需）
echo "正在初始化数据库..."
npm run db:generate
echo "数据库初始化完成"


# 3. 构建项目
npm run build