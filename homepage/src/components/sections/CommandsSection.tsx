import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Cmd = { name: string; desc: string; example?: string };

const commands: Cmd[] = [
  { name: "vibe create", desc: "创建新项目", example: "vibe create my-app" },
  {
    name: "vibe install",
    desc: "集成模块(认证/支付/数据库/存储等)",
    example: "vibe install auth --provider=clerk",
  },
  { name: "vibe templates", desc: "查看可用模板" },
  { name: "vibe update", desc: "更新依赖与脚手架" },
  { name: "vibe revise", desc: "修订与对齐配置" },
  { name: "vibe upgrade", desc: "升级 vibecape CLI" },
  { name: "vibe health", desc: "健康检查与诊断" },
  { name: "vibe config", desc: "查看/修改全局配置" },
];

export const CommandsSection: FC = () => {
  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">CLI 命令概览</h2>
          <p className="text-muted-foreground mt-3">
            用法清晰、一步到位。更多细节见 Docs。
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {commands.map((c) => (
            <Card key={c.name}>
              <CardHeader>
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{c.desc}</p>
                {c.example ? (
                  <code className="text-xs rounded bg-muted/60 px-2 py-1 inline-block">
                    {c.example}
                  </code>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommandsSection;

