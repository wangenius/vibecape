import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PiArrowDown } from "react-icons/pi";

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

  const handleDownload = () => {
    // 跳转到GitHub releases页面
    window.open("https://github.com/vibe-cli/vibe/releases", "_blank");
  };

  return (
    <>
      <section className="relative min-h-screen max-h-screen !-mt-14 overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/30">
        <div className="relative min-h-screen !-mt-14 flex items-center justify-center overflow-hidden">
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
                  SaaS 应用搭建神器
                </motion.span>
              </motion.div>

              {/* 副标题 - 添加精致的描述样式 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-14 text-xl"
              >
                让开发者用一行命令就能快速搭建出完整的在线服务系统。
                支持认证、支付、数据库、国际化等中间件的快速集成。
              </motion.div>

              {/* 按钮组 - 更加高级的按钮设计 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <motion.button
                  onClick={handleDownload}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex cursor-pointer items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 border border-primary/20"
                >
                  安装 vibecape
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PiArrowDown size={24} />
                  </motion.span>
                </motion.button>

                <a
                  className="group relative text-lg cursor-pointer font-semibold px-8 py-4 overflow-hidden !text-primary !no-underline"
                  href="/docs/introduction"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                    查看文档
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
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
            >
              <PiArrowDown size={36} />
            </motion.div>
          </motion.div>
        </div>
        <motion.img
          src="/image-black.png"
          alt="vibecape 平台界面"
          className="max-w-7xl h-auto object-cover mx-auto absolute -bottom-48 left-1/2 transform -translate-x-1/2 rounded-3xl"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.5 }}
        />
      </section>
    </>
  );
};

export default Hero;
