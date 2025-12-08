import type { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";

const quotes = [
  {
    q: "Ten minutes to run. I never worry about scaffolding new projects anymore.",
    a: "@solo-dev",
  },
  {
    q: "Standardized the tedious integration work. The team got up to speed incredibly fast.",
    a: "CTO, Seed Startup",
  },
  {
    q: "It's like building an online service with LEGO blocks.",
    a: "Product Designer",
  },
];

export const TestimonialsSection: FC = () => {
  return (
    <section className="py-16 border-t bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            What Users Say
          </h2>
          <p className="text-muted-foreground mt-3">
            Real feedback, real output.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((it, i) => (
            <Card key={i} className="bg-background border-border/50">
              <CardContent className="p-6">
                <p className="text-base leading-relaxed italic">
                  &quot;{it.q}&quot;
                </p>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">
                  {it.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
