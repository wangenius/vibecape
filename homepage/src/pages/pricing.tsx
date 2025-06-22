import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { PiArrowDown, PiArrowRight, PiCheck } from "react-icons/pi";

export default function Pricing() {
  const [isHovered, setIsHovered] = useState(false);
  
  // 定价方案数据
  const pricingPlans = [
    {
      id: "personal",
      name: "Personal Version",
      price: "Free",
      features: [
        "any capabilities",
        "agent",
        "plugin",
        "workflow",
        "knowledge base",
        "market access",
        "community support"
      ],
      buttonText: "Get started",
      popular: false
    },
    {
      id: "enterprise",
      name: "Enterprise Version",
      price: "Contact us for information",
      features: [
        "All personal version features",
        "Exclusive customer manager",
        "Private deployment options",
        "Custom integration",
        "Business-based customization",
        "Priority technical support"
      ],
      buttonText: "Contact us",
      popular: true
    }
  ];

  return (
    <Layout>
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
                  pricing plans
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
                  Flexible choices for personal users and enterprises
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
                  Check out
                  <motion.span
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PiArrowRight size={24} />
                  </motion.span>
                </motion.button>

                <a
                  className="group relative text-lg cursor-pointer font-semibold px-8 py-4 overflow-hidden !text-primary !no-underline"
                  href="#faq"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                    FAQ
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

      {/* 定价方案部分 - 简化设计 */}
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
              <div className="text-3xl md:text-4xl font-bold mb-4">Choose the plan that suits you</div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-card border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className={`p-6 ${
                  plan.id === "personal" 
                    ? "bg-primary/10 border-b border-primary/10" 
                    : "bg-secondary/10 border-b border-secondary/10"
                }`}>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
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
                    className={`w-full py-2.5 px-4 rounded-md font-medium text-center transition-colors bg-primary text-white hover:bg-primary/90`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 常见问题部分 */}
      <section id="faq" className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-6"
            >
              <span className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                FAQ
              </span>
            </motion.div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div
              className="bg-card border border-gray-200 rounded-lg p-5 shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">What are plans for the personal version?</h3>
              <p className="text-muted-foreground">
                There is no charge for the personal version before the version of 2.0. after the version of 2.0, the capabilities of 1.0 will also be available for free.
              </p>
            </div>

            <div
              className="bg-card border border-gray-200 rounded-lg p-5 shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">How to contact us for the enterprise version quote?</h3>
              <p className="text-muted-foreground">
                Please contact us through the contact form on the official website or send an email to upterophyllum@gmail.com.
              </p>
            </div>

            <div
              className="bg-card border border-gray-200 rounded-lg p-5 shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2">Do you offer custom services for the enterprise version?</h3>
              <p className="text-muted-foreground">
                Yes, the enterprise version can provide customized services and integration solutions according to your specific needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div
            className="bg-card border border-gray-200 rounded-lg p-8 text-center max-w-3xl mx-auto shadow-sm"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Need more information?</h2>
            <p className="text-lg mb-6">
              If you have any questions about our pricing plans, or need more information, please contact our team.
            </p>
            <button
              className="px-8 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Contact us
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
