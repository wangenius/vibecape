import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";

const quotes = [
  {
    q: "十分钟跑通，从此新项目再也不纠结脚手架。",
    a: "@solo-dev",
  },
  {
    q: "把繁琐的集成标准化了，团队上手很快。",
    a: "CTO, Seed Startup",
  },
  {
    q: "像搭乐高一样拼出一个在线服务。",
    a: "Product Designer",
  },
];

export const TestimonialsSection: FC = () => {
  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">用户反馈</h2>
          <p className="text-muted-foreground mt-3">真实声音，真实提升。</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((it, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <p className="text-base leading-relaxed">“{it.q}”</p>
                <p className="mt-4 text-sm text-muted-foreground">{it.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

