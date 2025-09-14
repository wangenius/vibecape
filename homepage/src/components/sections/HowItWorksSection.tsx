import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const HowItWorksSection: FC = () => {
  const steps = [
    {
      title: "安装 CLI",
      desc: "全局安装 vibecape，随时随地创建项目。",
      code: "npm install -g vibecape",
    },
    {
      title: "创建项目",
      desc: "一条命令生成工程化脚手架，零配置开箱即用。",
      code: "vibe create my-app",
    },
    {
      title: "按需集成",
      desc: "选择所需模块：认证、支付、数据库、存储等。",
      code: "vibe install auth --provider=clerk",
    },
  ];

  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">如何开始</h2>
          <p className="text-muted-foreground mt-3">3 步从想法到在线服务。</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, idx) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-lg">
                  <span className="mr-2 text-primary">{idx + 1}.</span>
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                <pre className="rounded-md bg-muted/50 p-3 text-xs overflow-x-auto">
                  <code>{s.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

