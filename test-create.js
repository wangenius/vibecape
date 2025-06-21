#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 测试 Vibe CLI 项目创建功能...\n');

// 创建测试项目
const testProjectName = 'test-vibe-project';
const cliPath = path.join(__dirname, 'dist/cli.js');

const child = spawn('node', [cliPath, 'create', testProjectName, '--template', 'basic-saas'], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ 项目创建测试完成！');
    console.log(`\n请查看创建的项目: ${testProjectName}/`);
    console.log('\n下一步测试:');
    console.log(`cd ${testProjectName}`);
    console.log('npm install');
    console.log('npm run dev');
  } else {
    console.log(`\n❌ 项目创建测试失败，退出码: ${code}`);
  }
}); 