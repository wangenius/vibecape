import { dialog } from "@/components/custom/DialogModal";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BsStars } from "react-icons/bs";
import { TbHelp, TbLock, TbPlanet } from "react-icons/tb";
const slides = [
  {
    icon: TbPlanet,
    title: "创作世界的缔造者",
    description:
      "打造属于你的独特世界观！通过智能化的情节编排系统，轻松构建宏大故事架构；运用角色OC设计工具，塑造栩栩如生的人物；借助完整的设定体系，让你的创作更加丰富多彩。实时追踪创作进度，让灵感永不停歇。",
    gradient: "from-primary via-primary to-ring",
  },
  {
    icon: BsStars,
    title: "AI创作的得力助手",
    description:
      "让AI成为你的专属创作伙伴！从世界观构思到剧情发展，从人物对话到场景描写，AI助手将全程陪伴。智能分析情节走向，提供灵感建议，协助润色文字，让你的创作之路畅通无阻。解放创作者的双手，专注于故事本身的魅力！",
    gradient: "from-chart-1 via-chart-2 to-chart-3",
  },
  {
    icon: TbLock,
    title: "安心创作的隐私保护",
    description:
      "全新一代基于浏览器的本地存储机制，为您带来便捷与安心的创作体验！灵感迸发、故事大纲与创作内容统统安全存储于您的本地设备，无需担忧作品外泄，全面保障您的珍贵创作永不丢失。这是您专属的创作天地，尽情书写您的精彩故事吧！",
    gradient: "from-chart-4 via-chart-5 to-accent",
  },
  {
    icon: TbHelp,
    title: "全方位创作指南",
    description:
      "为写作者量身打造的完整教程体系！从创作理论到实用技巧，从工具使用到写作心得，我们提供专业的指导。遇到问题？随时查阅详尽的帮助文档，或寻求社区中其他创作者的建议。让我们一起在创作的道路上互相启发！",
    gradient: "from-destructive via-primary to-accent",
  },
];
const TutorPanel = ({ close }: { close: () => void }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden">
      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative h-[500px] rounded-3xl overflow-hidden"
                onClick={() => {
                  if (index < totalSlides - 1) {
                    api?.scrollNext();
                  } else {
                    close();
                  }
                }}
                style={{
                  cursor: index < totalSlides - 1 ? "pointer" : "default",
                }}
              >
                {/* 背景渐变 */}
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-br opacity-50",
                    slide.gradient
                  )}
                />

                {/* 玻璃态背景 */}
                <div className="absolute inset-0 backdrop-blur-3xl bg-background/40" />

                {/* 装饰性图案 */}
                <div className="absolute inset-0">
                  <div className="absolute w-[500px] h-[500px] -right-48 -top-48 rounded-full bg-primary/20 blur-[80px]" />
                  <div className="absolute w-[300px] h-[300px] -left-32 -bottom-32 rounded-full bg-primary/10 blur-[60px]" />
                </div>

                {/* 内容区域 */}
                <div className="relative h-full flex flex-col items-center justify-center px-16 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-8"
                  >
                    <div
                      className={cn(
                        "relative inline-flex p-6 rounded-2xl",
                        "bg-background/10 backdrop-blur-xl border border-border/20"
                      )}
                    >
                      <slide.icon className="relative z-10 w-16 h-16 text-foreground" />
                    </div>
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-5xl font-bold mb-6 text-foreground"
                  >
                    {slide.title}
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-lg text-foreground/90 max-w-3xl leading-relaxed mb-12"
                  >
                    {slide.description}
                  </motion.p>

                  {index === totalSlides - 1 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="flex gap-4 items-center absolute bottom-10"
                    >
                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={() =>
                          window.open(
                            "https://jezzlab.com/docs/start",
                            "_blank"
                          )
                        }
                        className={cn(
                          "text-muted-foreground pl-4 pr-3 hover:bg-background/10 hover:text-foreground"
                        )}
                      >
                        查看教程 <TbHelp className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* 导航点 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                "border border-border/50 backdrop-blur-md",
                currentSlide === index
                  ? "w-12 h-3 bg-primary"
                  : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <CarouselPrevious className="hidden sm:flex -left-20 h-14 w-14 bg-background/10 hover:bg-background/20 backdrop-blur-xl border-border/20" />
        <CarouselNext className="hidden sm:flex -right-20 h-14 w-14 bg-background/10 hover:bg-background/20 backdrop-blur-xl border-border/20" />
      </Carousel>
    </div>
  );
};

TutorPanel.open = () => {
  dialog({
    closeIconHide: true,
    transparent: true,
    className: "max-w-7xl bg-transparent backdrop-blur-none",
    content: (close) => <TutorPanel close={close} />,
  });
};

export default TutorPanel;
