import { motion } from "framer-motion";

const ToolKit = () => {
  const features = [
    {
      title: (
        <h2>
          <span className="text-gradient">Multi-Agent Collaboration System</span>
        </h2>
      ),
      desc: (
        <p className="text-muted-foreground text-lg leading-relaxed">
          Support the creation and management of multiple AI assistants, each assistant can configure different models and knowledge bases. Assistants can collaborate with each other, automatically assign tasks, and implement the automation of complex workflows.
        </p>
      ),
      img: (
        <div className="relative overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            src={"multiAgent.png"}
            alt="Multi-Agent Collaboration System"
          />
        </div>
      ),
    },
    {
      title: (
        <h2>
          <span className="text-gradient">Workflow Engine</span>
        </h2>
      ),
      desc: (
        <p className="text-muted-foreground text-lg leading-relaxed">
          Visual workflow design tool, support conditional branches, loops and error handling. Through simple drag-and-drop operations, you can create complex automated workflows, so that the AI assistant can execute tasks according to the preset process.
        </p>
      ),
      img: (
        <div className="relative overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            src={"workflow-engine.png"}
            alt="Workflow Engine"
          />
        </div>
      ),
    },
    {
      title: (
        <h2>
          <span className="text-gradient">Plugin System & MCP support</span>
        </h2>
      ),
      desc: (
        <p className="text-muted-foreground text-lg leading-relaxed">
          Lightweight plugin development framework, use TypeScript to quickly develop plugins. Support hot reloading, no complex environment configuration. Built-in plugin market, easily extend system functionality.
          Support MCP, seamless integration of third-party services, quick extension of ecosystem capabilities, integration of various large models.
        </p>
      ),
      img: (
        <div className="relative overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover shadow-lg"
            src={"plugins.png"}
            alt="Plugin System"
          />
        </div>
      ),
    },
    {
      title: (
        <h2>
          <span className="text-gradient">Knowledge Base Management</span>
        </h2>
      ),
      desc: (
        <p className="text-muted-foreground text-lg leading-relaxed">
          Support the import of documents in various formats, automatically parse and establish indexes. Real-time update of knowledge base, intelligent retrieval and filtering. Support private deployment, ensure data security.
        </p>
      ),
      img: (
        <div className="relative overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            src={"knowledge.png"}
            alt="Knowledge Base Management"
          />
        </div>
      ),
    },
  ];
  return (
    <section
      id="toolkit"
      className="py-24 bg-gradient-to-b from-background to-muted/30"
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center"
          >
            <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Modules
            </span>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              vibecape 提供完整的模块来开发你的 SaaS 应用
            </p>
          </motion.div>
        </div>
        <div className="space-y-24">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className={idx % 2 === 0 ? "lg:order-1" : "lg:order-2"}>
                <div className="text-3xl font-bold tracking-tight mb-6">
                  {item.title}
                </div>
                {item.desc}
              </div>
              <div
                className={`${
                  idx % 2 === 0 ? "lg:order-2" : "lg:order-1"
                } bg-muted rounded-xl p-4`}
              >
                {item.img}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ToolKit;
