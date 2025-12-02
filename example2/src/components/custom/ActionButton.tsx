import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  desc: string;
  dark?: boolean;
  onClick: () => void;
}

export const ActionButton = ({
  icon: Icon,
  label,
  desc,
  dark,
  onClick,
}: ActionButtonProps) => (
  <motion.button
    onClick={onClick}
    whileHover="hover"
    initial="initial"
    animate="initial"
    variants={{
      initial: { scale: 1 },
      hover: { scale: 1.02 },
    }}
    className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
      dark ? 'bg-primary' : 'bg-background border border-border'
    }`}
  >
    {/* 背景装饰 */}
    <motion.div
      variants={{
        initial: { opacity: 0.02, scale: 1, rotate: 0 },
        hover: { opacity: 0.05, scale: 1.1, rotate: -3 },
      }}
      transition={{ duration: 0.3 }}
      className={`absolute right-0 top-0 w-48 h-48 -translate-y-12 translate-x-12 ${
        dark ? 'text-background' : 'text-foreground'
      }`}
    >
      <Icon className="w-full h-full" strokeWidth={0.5} />
    </motion.div>

    <div className="relative p-6 h-40 flex flex-col">
      {/* 图标区域 */}
      <motion.div
        variants={{
          initial: { y: 0 },
          hover: { y: -2 },
        }}
        className={`mb-auto ${dark ? 'text-background' : 'text-foreground'}`}
      >
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-colors ${
            dark ? 'bg-background/10' : 'bg-muted'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </motion.div>

      {/* 文字区域 */}
      <motion.div
        variants={{
          initial: { y: 0 },
          hover: { y: -2 },
        }}
        className="space-y-2"
      >
        <div
          className={`text-base font-medium ${
            dark ? 'text-background' : 'text-foreground'
          }`}
        >
          {label}
        </div>
        <div
          className={`text-sm ${dark ? 'text-muted' : 'text-muted-foreground'}`}
        >
          {desc}
        </div>
      </motion.div>

      {/* 悬浮时显示的箭头 */}
      <motion.div
        variants={{
          initial: { opacity: 0, x: -10 },
          hover: { opacity: 1, x: 0 },
        }}
        className={`absolute right-6 bottom-6 ${
          dark ? 'text-background/30' : 'text-muted-foreground'
        }`}
      >
        <ArrowRight className="w-5 h-5" />
      </motion.div>
    </div>
  </motion.button>
);
