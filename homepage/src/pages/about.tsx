import Layout from "@theme/Layout";
import { PiArrowRight, PiHeart, PiUsers, PiHandshake, PiEnvelope } from "react-icons/pi";

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
              <p>
                vibecape 成立于 2024 年，是一家专注于开发者工具创新的公司。我们的使命是帮助个人和企业更高效地完成工作，释放创造力，实现快速的 SaaS 应用开发和部署。
            </p>
            
            <h2>我们的愿景</h2>
            <p>
              让每个有想法的人都能在半小时内搭建出自己的在线服务产品。不管你是想做独立开发者的程序员、有创业想法的产品经理、想要技术实现想法的设计师，还是需要快速验证想法的企业家。
            </p>

            <h2>核心价值</h2>
            <ul>
              <li><strong>超简单</strong>：一行命令解决复杂配置，不需要懂技术细节</li>
              <li><strong>超快速</strong>：30分钟搭建完成，不是30天</li>
              <li><strong>超专业</strong>：内置最佳实践，媲美大厂技术架构</li>
              <li><strong>超灵活</strong>：需要什么功能就加什么，不浪费资源</li>
            </ul>

            <h2>联系我们</h2>
                          <p>
                如果您对 vibecape 有任何疑问或建议，欢迎通过以下方式联系我们：
              </p>
            <ul>
              <li>GitHub: <a href="https://github.com/vibe-cli/vibe">https://github.com/vibe-cli/vibe</a></li>
              <li>Email: team@vibecape.com</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

