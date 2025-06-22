import React from 'react';

function Footer(): React.ReactElement | null {

  return (
    <footer className="footer footer--dark bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
                          <img src="/logo.svg" alt="vibecape" className="w-8 h-8" />
            <span className="text-xl font-bold">
              vibecape
            </span>
            </div>
            <p className="text-gray-400 text-sm">
              SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li><a href="/docs/guide/getting-started" className="text-gray-400 hover:text-white">快速开始</a></li>
              <li><a href="/docs/guide/creating-project" className="text-gray-400 hover:text-white">创建项目</a></li>
              <li><a href="/docs/integrations" className="text-gray-400 hover:text-white">集成指南</a></li>
              <li><a href="/docs/templates" className="text-gray-400 hover:text-white">模板</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">资源</h3>
            <ul className="space-y-2">
              <li><a href="/docs/reference/commands" className="text-gray-400 hover:text-white">命令参考</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white">博客</a></li>
              <li><a href="https://github.com/vibe-cli/vibe" className="text-gray-400 hover:text-white">GitHub</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4">社区</h3>
            <ul className="space-y-2">
              <li><a href="https://github.com/vibe-cli/vibe/discussions" className="text-gray-400 hover:text-white">讨论</a></li>
              <li><a href="https://github.com/vibe-cli/vibe/issues" className="text-gray-400 hover:text-white">问题反馈</a></li>
              <li><a href="https://twitter.com/vibe_cli" className="text-gray-400 hover:text-white">Twitter</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 vibecape Team. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
