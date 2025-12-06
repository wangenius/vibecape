import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Terminal, Box, Lock } from "lucide-react";

export const FeaturesSection: FC = () => {
  const features = [
    {
      title: "AI-Native Workflow",
      desc: "Prompt-driven development integrated directly into your terminal. Generate features, not just code.",
      icon: Sparkles,
    },
    {
      title: "Zero Config",
      desc: "Opinionated defaults for Auth, DB, and Deployment. Skip the wiring and start building.",
      icon: Box,
    },
    {
      title: "Production Ready",
      desc: "Built on modern standards. Type-safe, scalable, and secure by default.",
      icon: Lock,
    },
    {
      title: "Developer First",
      desc: "A CLI that respects your intelligence. No magic, just clean, extendable code.",
      icon: Terminal,
    },
  ];

  return (
    <section className="py-20 border-t bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Why vibecape?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Stop wrestling with configuration. Vibecape unifies the best tools
            into a cohesive coding experience designed for the AI era.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="bg-background border-border/50 transition-all hover:border-foreground/20"
            >
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <f.icon className="h-5 w-5 text-muted-foreground" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
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
