import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const UseCasesSection: FC = () => {
  const cases = [
    {
      title: "独立开发者",
      desc: "快速验证想法，从 MVP 到上线只需一下午。",
    },
    {
      title: "初创团队",
      desc: "标准化工程与模板，缩短 0→1 的搭建周期。",
    },
    {
      title: "企业内部工具",
      desc: "统一集成规范，降低维护成本，提高交付效率。",
    },
    {
      title: "设计师 / 产品",
      desc: "不必深入复杂配置，也能快速落地你的创意。",
    },
  ];

  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">适用场景</h2>
          <p className="text-muted-foreground mt-3">为不同角色与团队而生。</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <Card key={c.title}>
              <CardHeader>
                <CardTitle className="text-xl">{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;

