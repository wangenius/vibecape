import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Cmd = { name: string; desc: string; example?: string };

const commands: Cmd[] = [
  {
    name: "vibe create",
    desc: "Initialize a new project",
    example: "vibe create my-app",
  },
  {
    name: "vibe install",
    desc: "Add capabilities (Auth, DB, Payments)",
    example: "vibe install auth --provider=clerk",
  },
  { name: "vibe templates", desc: "List available templates" },
  { name: "vibe update", desc: "Update dependencies and CLI" },
  { name: "vibe revise", desc: "Align configuration with schema" },
  { name: "vibe upgrade", desc: "Upgrade vibecape CLI" },
  { name: "vibe health", desc: "Diagnose environment issues" },
  { name: "vibe config", desc: "Manage global settings" },
];

export const CommandsSection: FC = () => {
  return (
    <section className="py-16 border-t bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            CLI Reference
          </h2>
          <p className="text-muted-foreground mt-3">
            Simple, intuitive commands. See Docs for full reference.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {commands.map((c) => (
            <Card key={c.name} className="bg-background border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-mono">{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                {c.example ? (
                  <code className="text-xs rounded bg-muted px-2 py-1 inline-block font-mono text-foreground/80">
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
