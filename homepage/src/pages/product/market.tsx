import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { PiArrowDown, PiArrowRight } from "react-icons/pi";

export default function Market() {
  const [isHovered, setIsHovered] = useState(false);

  // 市场类型数据
  const marketTypes = [
    {
      id: "plugins",
      name: "Plugins Marketplace",
      image: useBaseUrl("/market-plugin.png"),
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "agents",
      name: "Agents Marketplace",
      image: useBaseUrl("/market-agent.png"),
      color: "from-purple-600 to-pink-500",
    },
    {
      id: "workflows",
      name: "Workflows Marketplace",
      image: useBaseUrl("/market-workflow.png"),
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "knowledge",
      name: "Knowledge Base Marketplace",
      image: useBaseUrl("/knowledge.png"),
      color: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <Layout>
      {/* Hero 部分 - 参考 Hero.tsx */}
      <section className="relative min-h-[70vh] overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/30">
        <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
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
                                      vibecape Marketplace
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
                  Share and discover plugins, agents, workflows, and knowledge
                </motion.span>
              </motion.div>

              {/* 按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <motion.button
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex cursor-pointer items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 border border-primary/20"
                >
                  Explore
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PiArrowRight size={24} />
                  </motion.span>
                </motion.button>

                <a
                  className="group relative text-lg cursor-pointer font-semibold px-8 py-4 overflow-hidden !text-primary !no-underline"
                  href="/docs/market/introduction"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                    Learn more
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
      {marketTypes.map((market, index) => (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="py-5 px-4 bg-gradient-to-b from-muted/20 to-background"
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center"
            >
              <span className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                {market.name}
              </span>
              <img
                src={market.image}
                alt={market.name}
                className="max-w-full h-96 mx-auto rounded-xl my-4 object-cover"
              />
            </motion.div>
          </div>
        </motion.div>
      ))}
      {/* 市场类型展示 - 参考 Examples.tsx */}

      {/* 即将推出 - 参考 Testimonials.tsx */}
      <section id="upcoming" className="pb-16 bg-background relative">
        {/* 开发中提示 */}
        <motion.div
          className="max-w-3xl mx-auto bg-primary/5 rounded-xl p-8 text-center border border-primary/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">
            The web version is under development
          </h2>
          <p className="text-gray-600 mb-6">
            Our product market features are actively being developed, please
            stay tuned for the complete version!
          </p>
          <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Subscribe to update notifications
          </button>
        </motion.div>
      </section>
    </Layout>
  );
}
