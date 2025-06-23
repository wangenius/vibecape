#!/bin/bash

echo "🧪 开始测试 Vibe CLI..."
echo ""

# 测试1: 显示帮助信息
echo "📋 测试1: 显示帮助信息"
node ../dist/cli.js --help
echo ""

# 测试2: 显示版本信息
echo "📋 测试2: 显示版本信息"
node ../dist/cli.js --version
echo ""

# 测试3: 列出可用模板
echo "📋 测试3: 列出可用模板"
node ../dist/cli.js templates
echo ""

# 测试4: 健康检查
echo "📋 测试4: 健康检查"
node ../dist/cli.js health
echo ""

# 测试5: 创建项目（交互模式）
echo "📋 测试5: 创建项目（交互模式）"
echo "注意：这个测试需要手动输入，跳过自动测试"
# node ../dist/cli.js create my-test-app
echo ""

# 测试6: 创建项目（指定参数）
echo "📋 测试6: 创建项目（指定参数）"
echo "创建一个名为 auto-test-app 的项目，使用 basic-saas 模板..."
echo "ai-saas" | node ../dist/cli.js create auto-test-app
echo ""

# 检查创建的项目
if [ -d "auto-test-app" ]; then
    echo "✅ 项目创建成功！"
    echo "📁 项目结构："
    ls -la auto-test-app/
    echo ""
    echo "📄 package.json 内容："
    cat auto-test-app/package.json
    echo ""
    echo "📄 README.md 内容："
    cat auto-test-app/README.md
    echo ""
else
    echo "❌ 项目创建失败"
fi

echo "🎉 CLI 测试完成！" 