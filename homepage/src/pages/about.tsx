import Layout from "@theme/Layout";
import { PiArrowRight, PiHeart, PiUsers, PiHandshake, PiEnvelope, PiRocket, PiGear, PiShield } from "react-icons/pi";

export default function About() {
  return (
    <Layout
      title="关于我们 - vibecape SaaS 应用搭建神器"
      description="了解 vibecape 团队、使命与合作信息。vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
        \"@context\": \"https://schema.org\",
        \"@type\": \"Organization\",
        \"name\": \"vibecape\",
        \"url\": \"https://vibecape.com\",
        \"logo\": \"https://vibecape.com/logo.svg\",
        \"description\": \"vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。\"
      }` }} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">关于 vibecape</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">我们的使命</h2>
              <p className="text-lg">
                <strong>让每个有想法的人都能在半小时内搭建出自己的在线服务产品。</strong>
              </p>
              <p>
                vibecape 成立于 2024 年，专注于简化SaaS应用开发流程。我们相信复杂的技术应该被简单的工具所取代，让开发者能够专注于创造价值，而不是重复的配置工作。
              </p>
            </div>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PiRocket className="text-primary" />
              产品愿景
            </h2>
            <p>
              想象一下搭建SaaS应用就像搭积木一样简单：选择模板、添加功能、一键部署。这就是 vibecape 要实现的愿景。
            </p>
            <p>
              不管你是想做独立开发者的程序员、有创业想法的产品经理、想要技术实现想法的设计师，还是需要快速验证想法的企业家，vibecape 都能帮你快速实现想法。
            </p>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PiGear className="text-primary" />
              核心价值
            </h2>
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-2 text-blue-600">🎯 超简单</h3>
                <p>一行命令解决复杂配置，不需要懂技术细节。专注业务逻辑，而不是基础设施。</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-2 text-green-600">⚡ 超快速</h3>
                <p>30分钟搭建完成，不是30天。从想法到MVP，快速验证商业模式。</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-2 text-purple-600">🏆 超专业</h3>
                <p>内置最佳实践，媲美大厂技术架构。TypeScript、Tailwind CSS、现代化技术栈。</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-2 text-orange-600">🔧 超灵活</h3>
                <p>需要什么功能就加什么，不浪费资源。模块化设计，按需集成。</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PiShield className="text-primary" />
              技术理念
            </h2>
            <ul className="space-y-3">
              <li><strong>开发者优先</strong>：所有设计决策都以提升开发体验为核心</li>
              <li><strong>约定优于配置</strong>：合理的默认设置，减少配置复杂度</li>
              <li><strong>现代化技术栈</strong>：始终采用最新、最稳定的技术方案</li>
              <li><strong>可扩展架构</strong>：从MVP到企业级应用的平滑升级路径</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PiUsers className="text-primary" />
              我们服务的用户
            </h2>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">👨‍💻</div>
                <h3 className="font-bold mb-2">独立开发者</h3>
                <p className="text-sm text-muted-foreground">快速验证想法，专注产品核心功能</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-bold mb-2">初创团队</h3>
                <p className="text-sm text-muted-foreground">降低技术门槛，加速产品上市</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-bold mb-2">企业开发团队</h3>
                <p className="text-sm text-muted-foreground">标准化开发流程，提升团队效率</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PiEnvelope className="text-primary" />
              联系我们
            </h2>
            <p>
              如果您对 vibecape 有任何疑问、建议或合作意向，欢迎通过以下方式联系我们：
            </p>
            <div className="bg-muted p-6 rounded-lg my-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <PiHandshake className="text-primary" />
                  <strong>GitHub:</strong> 
                  <a href="https://github.com/vibe-cli/vibe" className="text-primary hover:underline">
                    https://github.com/vibe-cli/vibe
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <PiEnvelope className="text-primary" />
                  <strong>Email:</strong> 
                  <a href="mailto:team@vibecape.com" className="text-primary hover:underline">
                    team@vibecape.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <PiUsers className="text-primary" />
                  <strong>社区讨论:</strong> 
                  <a href="https://github.com/vibe-cli/vibe/discussions" className="text-primary hover:underline">
                    GitHub Discussions
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-3">准备开始你的SaaS开发之旅？</h3>
              <p className="mb-4">立即安装 vibecape，30分钟搭建你的第一个SaaS应用</p>
              <a 
                href="/docs/guide/getting-started"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors !no-underline"
              >
                开始使用
                <PiArrowRight />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

