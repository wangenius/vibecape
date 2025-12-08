import type { FC } from "react";
import { BookIcon, CodeIcon, FileTextIcon, PenToolIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const cases = [
  {
    icon: FileTextIcon,
    title: "技术文档",
    desc: "编写 API 文档、用户手册、产品说明。AI 帮你保持术语一致性。",
  },
  {
    icon: BookIcon,
    title: "知识库",
    desc: "构建团队知识库、学习笔记。树形结构组织，快速检索。",
  },
  {
    icon: PenToolIcon,
    title: "创意写作",
    desc: "小说、剧本、博客文章。AI 协助头脑风暴和润色。",
  },
  {
    icon: CodeIcon,
    title: "项目文档",
    desc: "README、设计文档、开发日志。与代码项目配套使用。",
  },
];

export const UseCasesSection: FC = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            适用场景
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            无论是技术文档还是创意写作，Vibecape 都能帮助你
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((item, i) => (
            <Card
              key={i}
              className="group overflow-hidden border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <CardContent className="p-6">
                <item.icon className="h-8 w-8 mb-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
