import React from 'react';

function Footer(): React.ReactElement | null {

  return (
    <footer className="footer footer--dark bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
                          <img src="/icon-white.svg" alt="vibecape" className="w-8 h-8" />
            <span className="text-xl font-bold">
              vibecape
            </span>
            </div>
            <p className="text-gray-400 text-sm">
              Vibecape is a SaaS application development tool that allows developers to quickly build complete online service systems with a single command.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick links</h3>
            <ul className="space-y-2">
              <li><a href="/docs/guide/getting-started" className="text-gray-400 hover:text-white">Getting started</a></li>
              <li><a href="/docs/guide/creating-project" className="text-gray-400 hover:text-white">Creating project</a></li>
              <li><a href="/docs/integrations" className="text-gray-400 hover:text-white">Integration guide</a></li>
              <li><a href="/docs/templates" className="text-gray-400 hover:text-white">Templates</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/docs/reference/commands" className="text-gray-400 hover:text-white">Command reference</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white">Blog</a></li>
              <li><a href="https://github.com/vibe-cli/vibe" className="text-gray-400 hover:text-white">GitHub</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li><a href="https://github.com/vibe-cli/vibe/discussions" className="text-gray-400 hover:text-white">Discussions</a></li>
              <li><a href="https://github.com/vibe-cli/vibe/issues" className="text-gray-400 hover:text-white">Issue feedback</a></li>
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
