import { Settings, FileCode, Puzzle, BarChart3, Bot, Monitor, Plug, Shield, Lock, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import featuresData from "@content/home/features.json";

const iconMap = {
  settings: Settings,
  "file-code": FileCode,
  puzzle: Puzzle,
  "bar-chart-3": BarChart3,
  bot: Bot,
  monitor: Monitor,
  plug: Plug,
  shield: Shield,
  lock: Lock,
  database: Database,
};

export function FeaturesSection() {
  const data = featuresData as typeof import("@content/home/features.json");

  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Core Features</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">核心特性</h2>
          <p className="text-lg text-muted-foreground">TKW.Framework 的十大核心能力</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((feature) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap] || Settings;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{feature.emoji}</span>
                    <Icon className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
