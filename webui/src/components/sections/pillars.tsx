import { Puzzle, Zap, BarChart3, Link, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import pillarsData from "@content/home/pillars.json";

const iconMap = { puzzle: Puzzle, zap: Zap, "bar-chart-3": BarChart3, link: Link, "book-open": BookOpen };

export function PillarsSection() {
  const data = pillarsData as typeof import("@content/home/pillars.json");

  return (
    <section id="pillars" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Design Pillars</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">五大设计支柱</h2>
          <p className="text-lg text-muted-foreground">TKW.Framework 的核心设计理念</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((pillar) => {
            const Icon = iconMap[pillar.icon as keyof typeof iconMap] || Puzzle;
            return (
              <Card key={pillar.title} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-2xl">{pillar.emoji}</span>
                    <Icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">{pillar.subtitle}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
