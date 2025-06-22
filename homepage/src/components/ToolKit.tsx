import { motion } from "framer-motion";
import { PiShield, PiCreditCard, PiGlobe, PiDatabase, PiEnvelope, PiCloudArrowUp, PiChartBar, PiGear } from "react-icons/pi";

const ToolKit = () => {
  const middlewareCategories = [
    {
      title: "User authentication",
      icon: <PiShield size={32} />,
      color: "from-blue-500 to-blue-600",
      providers: [
        { name: "Clerk", desc: "Ready-to-use UI components" },
        { name: "NextAuth", desc: "Flexible configuration options" },
        { name: "Supabase Auth", desc: "Open-source database integration" }
      ]
    },
    {
      title: "Payment system",
      icon: <PiCreditCard size={32} />,
      color: "from-green-500 to-green-600",
      providers: [
        { name: "Stripe", desc: "Global payment solution" },
        { name: "Paddle", desc: "Tax processing expert" },
        { name: "LemonSqueezy", desc: "Independent developer friendly" }
      ]
    },
    {
      title: "Database service",
      icon: <PiDatabase size={32} />,
      color: "from-purple-500 to-purple-600",
      providers: [
        { name: "Supabase", desc: "PostgreSQL + real-time features" },
        { name: "PlanetScale", desc: "MySQL + branch management" },
        { name: "Neon", desc: "Serverless PostgreSQL" }
      ]
    },
    {
      title: "Internationalization",
      icon: <PiGlobe size={32} />,
      color: "from-orange-500 to-orange-600",
      providers: [
        { name: "next-intl", desc: "Next.js static generation" },
        { name: "react-i18next", desc: "Mature ecosystem" }
      ]
    },
    {
      title: "Email service",
      icon: <PiEnvelope size={32} />,
      color: "from-red-500 to-red-600",
      providers: [
        { name: "Resend", desc: "Modern developer-friendly API" },
        { name: "SendGrid", desc: "Enterprise-level service" },
        { name: "Mailgun", desc: "Powerful API features" }
      ]
    },
    {
      title: "File storage",
      icon: <PiCloudArrowUp size={32} />,
      color: "from-cyan-500 to-cyan-600",
      providers: [
        { name: "Cloudinary", desc: "Image processing + CDN" },
        { name: "AWS S3", desc: "Reliable cloud storage" },
        { name: "Supabase Storage", desc: "Open-source permission control" }
      ]
    },
    {
      title: "Analytics",
      icon: <PiChartBar size={32} />,
      color: "from-indigo-500 to-indigo-600",
      providers: [
        { name: "Mixpanel", desc: "User behavior analysis" },
        { name: "PostHog", desc: "Open-source full-featured" },
        { name: "Google Analytics", desc: "Free website analysis" }
      ]
    },
    {
      title: "Deployment service",
      icon: <PiGear size={32} />,
      color: "from-gray-500 to-gray-600",
      providers: [
        { name: "Vercel", desc: "Native support for Next.js" },
        { name: "Netlify", desc: "Static site expert" },
        { name: "Railway", desc: "Full-stack deployment platform" }
      ]
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ecosystem
          </span>
          <p className="text-xl text-muted-foreground mt-4">
            Support mainstream service providers, one-line command to complete integration configuration
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {middlewareCategories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
              }}
              viewport={{ once: true, margin: "-50px" }}
              className="group"
            >
              <div className="h-full rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:scale-[1.02] hover:-translate-y-1">
                {/* 图标和标题 */}
                <div className="mb-6">
                  <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                </div>

                {/* 服务提供商列表 */}
                <div className="space-y-3">
                  {category.providers.map((provider, providerIdx) => (
                    <div key={providerIdx} className="border-l-2 border-primary/20 pl-3">
                      <div className="font-semibold text-sm">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">{provider.desc}</div>
                    </div>
                  ))}
                </div>

                {/* 安装命令示例 */}
                <div className="mt-4 pt-4 border-t border-muted/30">
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="font-mono text-xs text-green-400">
                      $ vibe install {category.title === "User authentication" ? "auth" : 
                                     category.title === "Payment system" ? "payments" :
                                     category.title === "Database service" ? "database" :
                                     category.title === "Internationalization" ? "i18n" :
                                     category.title === "Email service" ? "email" :
                                     category.title === "File storage" ? "storage" :
                                     category.title === "Analytics" ? "analytics" : "deploy"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Continuously expanding</h3>
            <p className="text-muted-foreground mb-6">
              We are constantly adding more service providers to support you, giving you more choices
            </p>
            <a
              href="/docs/integrations"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors !no-underline"
            >
              View full list
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolKit;
