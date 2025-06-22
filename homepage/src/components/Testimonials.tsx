import { motion } from "framer-motion";

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "vibecape 显著提高了我的开发效率。快速集成功能帮助我处理了许多繁琐的配置工作。最棒的是它的一键部署功能，让我可以专注于业务逻辑而不是基础设施。",
      name: "张明",
      title: "全栈开发工程师",
    },
    {
      quote:
        "作为一个经常需要快速验证想法的创业者，vibecape 的模板和中间件集成功能对我帮助很大。它不仅智能，而且真正理解我的开发流程。几分钟就能搭建起一个完整的 SaaS 应用，这让我感到惊喜。",
      name: "李华",
      title: "创业者",
    },
    {
      quote:
        "我使用 vibecape 来快速搭建客户项目，效果很好。它的工作流引擎自动化了许多重复性任务，插件系统也很容易扩展新功能。",
      name: "王芳",
      title: "技术顾问",
    },
  ];

  return (
    <section id="testimonials" className="py-32 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/10 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">User Feedback</span>

        </motion.div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {testimonials.map((item, idx) => (
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              key={idx}
              className="bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-border/30 hover:border-border/60 transition-all"
            >
              <blockquote className="text-muted-foreground mb-6 text-sm leading-relaxed">
                "{item.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.title}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
