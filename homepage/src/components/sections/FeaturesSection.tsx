import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const FeaturesSection: FC = () => {
  const features = [
    {
      title: "超简单",
      desc: "一行命令完成复杂配置，聚焦你的业务逻辑。",
    },
    {
      title: "超快速",
      desc: "从 0 到可运行项目，用分钟而不是天。",
    },
    {
      title: "超专业",
      desc: "内置最佳实践与主流集成，媲美大厂技术栈。",
    },
    {
      title: "超灵活",
      desc: "按需选择模块：认证、支付、数据库、存储、监控等。",
    },
  ];

  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">核心特性</h2>
          <p className="text-muted-foreground mt-3">
            基于 vibecape CLI 的工程化能力，快速搭建并扩展你的在线服务。
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <CardTitle className="text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

