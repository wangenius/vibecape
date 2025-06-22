import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { PiArrowDown, PiArrowRight, PiCheck, PiGithubLogo, PiDownload } from "react-icons/pi";

export default function Pricing() {
  const [isHovered, setIsHovered] = useState(false);
  
  // 定价方案数据
  const pricingPlans = [
    {
      id: "open-source",
      name: "开源版本",
      price: "免费",
      description: "完全免费的开源CLI工具",
      features: [
        "所有核心功能",
        "项目模板创建",
        "中间件快速集成",
        "配置管理工具",
        "社区技术支持",
        "GitHub开源代码",
        "持续功能更新",
        "完整使用文档"
      ],
      buttonText: "立即安装",
      buttonAction: "install",
      popular: true
    },
    {
      id: "enterprise",
      name: "企业服务",
      price: "联系咨询",
      description: "为企业团队提供专业支持服务",
      features: [
        "包含所有开源功能",
        "专属客户经理",
        "私有部署方案",
        "定制集成开发",
        "企业级技术培训",
        "优先技术支持",
        "SLA服务保障",
        "定制化模板开发"
      ],
      buttonText: "联系我们",
      buttonAction: "contact",
      popular: false
    }
  ];

  const handleInstall = () => {
    // 滚动到安装说明部分
    document.getElementById('installation')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContact = () => {
    window.open('mailto:team@vibecape.com?subject=企业服务咨询', '_blank');
  };

  return (
    <Layout
      title="价格方案 - vibecape SaaS 应用搭建神器"
      description="vibecape 是完全免费的开源CLI工具，同时为企业用户提供专业技术支持服务。"
    >
      {/* Hero 部分 */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/30">
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* 背景效果 */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-20 mix-blend-overlay"
            />
          </div>

          <div className="container mx-auto px-4 py-24 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              {/* 主标题 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <motion.div
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-2"
                  initial={{ backgroundPosition: "0% 0%" }}
                  animate={{ backgroundPosition: "100% 0%" }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  价格方案
                </motion.div>
                <motion.span
                  className="text-2xl md:text-3xl font-medium tracking-wide block"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  开源免费，企业增值服务
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-12 text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                vibecape 是完全开源免费的CLI工具，为所有开发者提供强大的SaaS应用搭建能力
              </motion.div>

              {/* 按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                 <motion.button
                  onClick={handleInstall}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex cursor-pointer items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 border border-primary/20"
                >
                  立即安装
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PiDownload size={24} />
                  </motion.span>
                </motion.button>

                <a
                  className="group relative text-lg cursor-pointer font-semibold px-8 py-4 overflow-hidden !text-primary !no-underline flex items-center gap-2"
                  href="https://github.com/vibe-cli/vibe"
                  target="_blank"
                >
                  <PiGithubLogo size={24} />
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                    查看源码
                  </span>
                </a>
              </motion.div>
            </div>
          </div>

          {/* 下滑指示动画 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-primary cursor-pointer"
              onClick={() =>
                window.scrollTo({
                  top: window.innerHeight * 0.7,
                  behavior: "smooth",
                })
              }
            >
              <PiArrowDown size={36} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 定价方案部分 */}
      <section id="pricing-plans" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-6"
            >
              <div className="text-3xl md:text-4xl font-bold mb-4">选择适合你的方案</div>
              <p className="text-muted-foreground text-lg">
                所有核心功能永久免费，企业用户可获得专业技术支持
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-50px" }}
                className={`bg-card border rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg ${
                  plan.popular ? "ring-2 ring-primary scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                    推荐方案
                  </div>
                )}
                <div className={`p-6 ${
                  plan.id === "open-source" 
                    ? "bg-primary/10 border-b border-primary/10" 
                    : "bg-secondary/10 border-b border-secondary/10"
                }`}>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-3">{plan.description}</p>
                  <div className="text-3xl font-bold">{plan.price}</div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <PiCheck className="text-primary mt-0.5 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={plan.buttonAction === 'install' ? handleInstall : handleContact}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 安装说明部分 */}
      <section id="installation" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">快速安装</h2>
              <p className="text-muted-foreground text-lg">
                几个简单步骤，立即开始使用 vibecape
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-card rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">1</div>
                <h3 className="font-bold mb-2">安装CLI</h3>
                <div className="bg-gray-900 rounded p-3 font-mono text-sm text-green-400">
                  npm install -g vibecape
                </div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">2</div>
                <h3 className="font-bold mb-2">创建项目</h3>
                <div className="bg-gray-900 rounded p-3 font-mono text-sm text-blue-400">
                  vibe create my-saas
                </div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <h3 className="font-bold mb-2">添加功能</h3>
                <div className="bg-gray-900 rounded p-3 font-mono text-sm text-yellow-400">
                  vibe install auth
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/docs/guide/getting-started"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors !no-underline"
              >
                查看完整教程
                <PiArrowRight />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
