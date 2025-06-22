import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PiArrowDown, PiArrowRight } from 'react-icons/pi';

export default function Market() {
  const [isHovered, setIsHovered] = useState(false);

  // 模板类型数据

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
                repeatType: 'reverse',
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
                  initial={{ backgroundPosition: '0% 0%' }}
                  animate={{ backgroundPosition: '100% 0%' }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  Vibecape Templates
                </motion.div>
                <motion.span
                  className="text-2xl md:text-3xl font-medium tracking-wide block"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  Discover and share high-quality project templates
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
                  onClick={() =>
                    window.open('https://template.vibecape.com', '_blank')
                  }
                  className="inline-flex cursor-pointer items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 border border-primary/20"
                >
                  Start now
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
        </div>
      </section>

    </Layout>
  );
}
