import type { FC } from "react";
import {
  FolderTreeIcon,
  BrainCircuitIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "工作区管理",
    description:
      "每个项目独立的文档库、聊天记录和 AI 提示词。统一的文档根目录，轻松备份和迁移。",
    icon: <FolderTreeIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "多模型支持",
    description:
      "支持 OpenAI、DeepSeek、Google、xAI 等多种 AI 服务商。按需切换，灵活配置。",
    icon: <BrainCircuitIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "llm.txt 上下文",
    description:
      "为每个工作区定制 AI 提示词，让 AI 理解你的项目背景、写作风格和术语。",
    icon: <SparklesIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "本地优先",
    description:
      "所有数据存储在本地，你的文档永远属于你。无云端锁定，无数据收集。",
    icon: <ShieldCheckIcon className="size-6 text-foreground/80" />,
  },
];

export const FeaturesSection: FC = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            为文档写作而生
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            不只是文本编辑器，是你的 AI 写作工作室
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="bg-background/60 border-border/50 backdrop-blur-sm transition-all hover:bg-background hover:shadow-sm"
            >
              <CardHeader>
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-secondary p-3">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
