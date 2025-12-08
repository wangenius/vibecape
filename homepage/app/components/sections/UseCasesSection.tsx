import type { FC } from "react";
import { BookIcon, FilmIcon, GamepadIcon, ScrollTextIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const cases = [
  {
    icon: BookIcon,
    title: "Novelists",
    desc: "Outline chapters, track character arcs, and maintain consistency across a trilogy.",
  },
  {
    icon: FilmIcon,
    title: "Screenwriters",
    desc: "Visualize scenes, manage beats, and export to standard screenplay formats.",
  },
  {
    icon: GamepadIcon,
    title: "Game Designers",
    desc: "Build lore bibles, branching dialogues, and quest chains with structural integrity.",
  },
  {
    icon: ScrollTextIcon,
    title: "TTRPG Masters",
    desc: "Orchestrate campaigns, NPC stats, and world events in real-time.",
  },
];

export const UseCasesSection: FC = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Infinite Canvases
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Whatever your medium, Vibecape adapts to your creative process.
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
