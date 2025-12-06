import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, Building, PenTool } from "lucide-react";

export const UseCasesSection: FC = () => {
  const cases = [
    {
      title: "Indie Developers",
      desc: "Validate ideas fast. Go from MVP to live product in a single afternoon.",
      icon: User,
    },
    {
      title: "Startups",
      desc: "Standardize engineering and templates. Shorten the 0→1 build cycle.",
      icon: Users,
    },
    {
      title: "Enterprise Internal Tools",
      desc: "Unified integration standards. Lower maintenance costs, higher delivery efficiency.",
      icon: Building,
    },
    {
      title: "Designers / PMs",
      desc: "No need for complex config deep-dives. Launch your creative ideas independently.",
      icon: PenTool,
    },
  ];

  return (
    <section className="py-20 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Built For Everyone
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Empowering different roles to build better software.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <Card
              key={c.title}
              className="bg-transparent border-none shadow-none"
            >
              <CardHeader className="px-0 pt-0">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <c.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
