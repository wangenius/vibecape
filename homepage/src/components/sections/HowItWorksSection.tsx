import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Plug2, FolderPlus, Zap } from "lucide-react";

export const HowItWorksSection: FC = () => {
  const steps = [
    {
      title: "Install the CLI",
      desc: "Add vibecape to your toolbelt.",
      code: "npm i vibecape",
      icon: Zap,
    },
    {
      title: "Initialize a project",
      desc: "Generate a production‑ready scaffold in seconds.",
      code: "vibe init",
      icon: FolderPlus,
    },
    {
      title: "Add modules on demand",
      desc: "Auth, payments, database, storage, and more.",
      code: "vibe add module",
      icon: Plug2,
    },
    {
      title: "Deploy with one command",
      desc: "Ship using unified scripts (Vercel/self‑host, etc.).",
      code: "vibe run deploy",
      icon: Rocket,
    },
  ];

  return (
    <section className="py-20 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground mt-3">Four steps from idea to live product.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => (
            <Card key={s.title} className="transition-shadow border-foreground/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="mr-1 text-muted-foreground">{idx + 1}.</span>
                  {s.icon ? <s.icon className="h-4 w-4 text-muted-foreground" /> : null}
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{s.desc}</p>
                <pre className="rounded-md bg-muted/40 p-3 text-xs overflow-x-auto">
                  <code>{s.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Tip: <code className="mx-1">vibe run</code> executes matching <code className="mx-1">.sh</code> scripts from <code className="mx-1">./scripts</code>.
        </p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
