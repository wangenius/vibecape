import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PiArrowDown, PiArrowRight, PiTerminal } from "react-icons/pi";

const Hero = ({
  setIsScrolled,
}: {
  setIsScrolled: (isScrolled: boolean) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    // 跳转到快速开始文档
    window.open("/docs/guide/getting-started", "_blank");
  };

  return (
    <>
      <section className="relative min-h-screen max-h-screen !mt-8 overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/30">
        <div className="relative min-h-screen !mt-8 flex items-center justify-center overflow-hidden">
          {/* 高级背景效果 */}
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
              {/* 主标题 - 使用更现代的排版和动画 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <motion.div
                  className="text-6xl sm:text-7xl lg:text-[100px] font-bold mb-2"
                  initial={{ backgroundPosition: "0% 0%" }}
                  animate={{ backgroundPosition: "100% 0%" }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  vibecape
                </motion.div>
                <motion.span
                  className="text-3xl md:text-4xl lg:text-6xl font-medium tracking-wide block"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  SaaS Builder AI CLI
                </motion.span>
              </motion.div>

              {/* 副标题 - 添加精致的描述样式 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8 text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto"
              >
                Build SaaS apps with a single command
              </motion.div>

              {/* 命令行演示 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-12 bg-gray-900 rounded-lg p-6 text-left max-w-2xl mx-auto"
              >
                <div className="flex items-center mb-4">
                  <PiTerminal className="text-green-400 mr-2" size={20} />
                  <span className="text-gray-400 text-sm">terminal</span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <span className="text-purple-400">$ curl</span>
                  <span className="text-gray-400"> -fsSL</span>
                  <span className="text-green-400"> https://vibecape.com/install.sh</span>
                  <span className="text-gray-400"> |</span>
                  <span className="text-purple-400"> bash</span>
                </div>
              </motion.div>

              {/* 按钮组 - 更加高级的按钮设计 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <motion.button
                  onClick={handleGetStarted}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex cursor-pointer items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 border border-primary/20"
                >
                  start using vibecape
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PiArrowRight size={24} />
                  </motion.span>
                </motion.button>

                <a
                  className="group relative text-lg cursor-pointer font-semibold px-8 py-4 overflow-hidden !text-primary !no-underline"
                  href="/docs/introduction"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                      view docs
                  </span>
                </a>
              </motion.div>

              {/* 特性亮点 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
              >
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary mb-2">30 minutes</div>
                  <div className="text-muted-foreground">from zero to complete SaaS app</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary mb-2">one command</div>
                  <div className="text-muted-foreground">integrate auth, payment, database</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-primary mb-2">ready to use</div>
                  <div className="text-muted-foreground">built-in best practices and architecture</div>
                </div>
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
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
            >
              <PiArrowDown size={36} />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Hero;
