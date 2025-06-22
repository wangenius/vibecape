import { motion } from 'framer-motion';
import { PiArrowRight, PiPlayCircle, PiTerminal } from 'react-icons/pi';

const examples = [
  {
    title: 'Create AI SaaS app',
    desc: "Quickly build AI-driven SaaS app: 'vibe create ai-chat --template=ai-saas', automatically configure OpenAI integration, user authentication, payment subscription system",
    command: 'vibe create ai-chat --template=ai-saas',
    name: 'AI SaaS',
  },
  {
    title: 'Integrate user authentication system',
    desc: "One-click add complete user authentication: 'vibe install auth --provider=clerk', including registration, login, password reset, social login, etc.",
    command: 'vibe install auth --provider=clerk',
    name: 'User authentication',
  },
  {
    title: 'Configure payment subscription system',
    desc: 'Quickly integrate Stripe payment: automatically configure subscription plans, webhook processing, invoice management, support one-time payment and regular subscription',
    command: 'vibe install payments --provider=stripe',
    name: 'Payment system',
  },
  {
    title: 'Multi-language internationalization',
    desc: 'Add multi-language support: automatically configure routing, translation file structure, language switching component, support SEO-optimized multi-language pages',
    command: 'vibe install i18n --provider=next-intl',
    name: 'Internationalization',
  },
  {
    title: 'Database configuration',
    desc: "Quickly configure database: 'vibe install database --provider=supabase', automatically generate ORM configuration, data table structure, and API interface",
    command: 'vibe install database --provider=supabase',
    name: 'Database',
  },
  {
    title: 'Email service integration',
    desc: 'Integrate email functionality: automatically configure email templates, send service, user notification system, support welcome email, password reset, etc.',
    command: 'vibe install email --provider=resend',
    name: 'Email service',
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
            Case
          </span>
          <div className="text-gray-600 text-lg mt-4">
            Vibecape makes SaaS app development simple and efficient, solving complex configurations with a single command
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
                className="bg-card rounded-xl overflow-hidden flex flex-col h-[320px] transition-shadow border border-muted/30 hover:shadow-lg"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {example.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{example.title}</h3>
                  <p className="text-gray-700 text-sm mb-4 flex-grow">
                    {example.desc}
                  </p>
                  
                  {/* 命令行演示 */}
                  <div className="bg-gray-900 rounded-lg p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <PiTerminal className="text-green-400 mr-2" size={16} />
                      <span className="text-gray-400 text-xs">终端</span>
                    </div>
                    <div className="font-mono text-xs text-green-400">
                      $ {example.command}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <a
                      href="/docs/guide/getting-started"
                      className="inline-flex !text-primary !no-underline items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors text-sm"
                    >
                      <PiPlayCircle size={16} />
                      <span>查看教程</span>
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
              className="bg-primary/10 rounded-xl overflow-hidden flex flex-col h-[320px] border-2 border-dashed border-primary/30"
            >
              <div className="p-6 flex flex-col items-center justify-center h-full">
                <div className="rounded-full bg-primary/20 p-5 mb-6">
                  <PiArrowRight size={30} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">
                  探索更多
                </h3>
                <p className="text-gray-700 text-center mb-6">
                  查看完整的功能列表和使用教程，开始你的SaaS开发之旅
                </p>
                <div className="text-center">
                  <a
                    href="/docs/guide/getting-started"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors !no-underline"
                  >
                    开始使用
                    <PiArrowRight className="w-4 h-4" />
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
