import { FC } from "react";
import {
  BookOpenIcon,
  BrainCircuitIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "World Orchestration",
    description:
      "Manage complex lore, timelines, and character relationships visually. Never lose track of your story's heartbeat.",
    icon: <BookOpenIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "AI Co-pilot",
    description:
      "An intelligent partner that understands your entire world context. Brainstorm plot twists, refine dialogue, and break writer's block.",
    icon: <BrainCircuitIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "Dynamic Context",
    description:
      "The AI changes its persona based on your characters. Write valid dialogue for a villain, a hero, or a merchant effortlessly.",
    icon: <SparklesIcon className="size-6 text-foreground/80" />,
  },
  {
    title: "Private & Local",
    description:
      "Your stories are yours. All data lives on your device. Zero cloud lock-in, zero data mining.",
    icon: <ShieldCheckIcon className="size-6 text-foreground/80" />,
  },
];

export const FeaturesSection: FC = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Built for Long-form Storytelling
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Beyond a simple text editor. A complete studio for your imagination.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="bg-background/60 border-border/50 backdrop-blur-sm transition-all hover:bg-background hover:shadow-sm"
            >
              <CardHeader>
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-secondary p-3">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
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
