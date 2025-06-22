import {
  PiRobot,
  PiDesktop,
  PiPlugs,
  PiFlowArrow,
  PiBooks,
  PiTarget,
  PiGlobe,
  PiPuzzlePiece,
} from "react-icons/pi";
import { motion } from "framer-motion";
import { TbArrowRight } from "react-icons/tb";

const Features = () => {
  const features = [
    {
      icon: <PiRobot size={28} />,
      title: "AI & Agent System",
      color: "from-blue-500 to-blue-400",
      desc: (
        <span>
          support multiple AI assistants, <strong>independent configuration of different models</strong>
          , intelligent context management, customizable assistant personality and behavior, support assistant collaboration.
        </span>
      ),
    },
    {
      icon: <PiDesktop size={28} />,
      title: "Desktop Integration",
      color: "from-indigo-500 to-blue-500",
      desc: (
        <span>
          full desktop system access, <strong>seamless integration of local environment</strong>
          , support system-level automation, native file system integration, achieve true desktop assistant.
        </span>
      ),
    },
    {
      icon: <PiPlugs size={28} />,
      title: "Plugin Architecture",
      color: "from-cyan-500 to-blue-400",
      desc: (
        <span>
          lightweight plugin system, support <strong>TS quick development of plugins</strong>
          , no environment configuration, plugin market, hot reloading, permission management.
        </span>
      ),
    },
    {
      icon: <PiFlowArrow size={28} />,
      title: "Workflow Engine",
      color: "from-emerald-500 to-teal-400",
      desc: (
        <span>
          visual workflow design, <strong>multi-agent collaboration</strong>
          , support conditional branches, loops, and error handling, automated task execution.
        </span>
      ),
    },
    {
      icon: <PiBooks size={28} />,
      title: "Knowledge Management",
      color: "from-violet-600 to-purple-500",
      desc: (
        <span>
          local knowledge base management, <strong>real-time knowledge update</strong>
          , support multiple formats, intelligent retrieval filtering, knowledge sharing and synchronization.
        </span>
      ),
    },
    {
      icon: <PiTarget size={28} />,
      title: "User Experience",
      color: "from-fuchsia-500 to-pink-500",
      desc: (
        <span>
          Alt+Space shortcut to wake up, <strong>modern UI design</strong>
          , automatic update, cross-platform consistency, excellent performance experience.
        </span>
      ),
    },
    {
      icon: <PiGlobe size={28} />,
      title: "MCP Support",
      color: "from-rose-500 to-red-500",
      desc: (
        <span>
          full support for MCP protocol, <strong>seamless integration of third-party services</strong>
          , quick extension of ecosystem capabilities, integration of various large models.
        </span>
      ),
    },
    {
      icon: <PiPuzzlePiece size={28} />,
      title: "Local Extension System",
      color: "from-amber-500 to-orange-400",
      desc: (
        <span>
          powerful local extension mechanism, <strong>support custom tool development</strong>
          , no cloud service, protect privacy data.
        </span>
      ),
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative">
      {/* 背景装饰 */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-40 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Features</span>

        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((item, idx) => (
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
              <div className="h-full rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 
                  hover:shadow-xl hover:border-primary/30 hover:scale-[1.02] hover:-translate-y-1">
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="mb-3 font-semibold tracking-tight text-xl group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="flex justify-center mt-16"
        >
          <a 
            href="/docs/features" 
            className="flex !text-primary !no-underline items-center gap-2 px-6 py-3 rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <span>View details and future plans</span>
            <TbArrowRight />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
