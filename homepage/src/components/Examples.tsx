import { motion } from 'framer-motion';
import { PiArrowRight, PiPlayCircle } from 'react-icons/pi';

const examples = [
  {
    title: '完成学生测试试卷',
    desc: "一句话完成复杂任务：'@xxx，制作一份高中数学单元测试卷，PDF格式，发送给xxx并要求他在周五前完成'",
    videoUrl: 'https://example.com/video1.mp4',
    name: '智能工作流',
  },
  {
    title: '文件管理',
    desc: "轻松处理文件任务：'整理文件，清理去年的文档并重新归档'或'将最近从微信下载的两个Word文件转换为PDF并合并打印'",
    videoUrl: 'https://example.com/video2.mp4',
    name: '文件管理',
  },
  {
    title: '联系安排下周活动',
    desc: '@xxx，联系xxx安排下周活动，确认后让@xxx找一家酒店 - 多个代理协同工作，自动分配并执行任务',
    videoUrl: 'https://example.com/video3.mp4',
    name: '多代理协作',
  },
  {
    title: '会议记录整理',
    desc: '自动整理会议记录，提取关键点并生成任务清单，分配给相关团队成员',
    videoUrl: 'https://example.com/video4.mp4',
    name: '智能助理',
  },
  {
    title: '数据分析报告',
    desc: "一键生成数据分析报告：'分析过去三个月的销售数据，找出趋势并预测下个季度的表现'",
    videoUrl: 'https://example.com/video5.mp4',
    name: '数据智能',
  },
];

export const Examples = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{
        opacity: isScrolled ? 1 : 0.3,
        y: isScrolled ? 0 : 50,
      }}
      transition={{ duration: 0.8 }}
      className="py-16 px-4 bg-gradient-to-b from-muted/20 to-background"
    >
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-12"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            应用示例
          </span>
          <div className="text-gray-600 text-lg mt-4">
            vibecape 专注于 SaaS 应用开发中的特定使用场景
          </div>
        </motion.div>
      </div>

      <div id="examples" className="py-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: '-50px' }}
                className="bg-muted rounded-xl overflow-hidden flex flex-col h-[280px] transition-shadow border border-muted/30"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {example.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{example.title}</h3>
                  <p className="text-gray-700 text-sm flex-grow">
                    {example.desc}
                  </p>
                  <div className="mt-4">
                    <a
                      href={example.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex !text-primary !no-underline items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <PiPlayCircle size={20} />
                      <span>观看演示</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 发现更多 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: examples.length * 0.1 }}
              viewport={{ once: true, margin: '-50px' }}
              className="bg-primary/10 rounded-xl overflow-hidden flex flex-col h-[280px] border-2 border-dashed border-primary/30"
            >
              <div className="p-6 flex flex-col items-center justify-center h-full">
                <div className="rounded-full bg-primary/20 p-5 mb-6">
                  <PiArrowRight size={30} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">
                  发现更多
                </h3>
                <p className="text-gray-700 text-center mb-6">
                  探索更多 vibecape 能够解决的实际开发场景
                </p>
                <div className="text-center">
                  <a
                    href="/docs/guide/getting-started"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors !no-underline"
                  >
                    探索更多 vibecape 能够解决的实际开发场景
                    <PiArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
