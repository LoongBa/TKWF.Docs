import { Rocket, BookOpen, Microscope, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import pathsData from "@content/home/paths.json";

const iconMap = { rocket: Rocket, "book-open": BookOpen, microscope: Microscope, bot: Bot };

export function PathsSection() {
  const data = pathsData as typeof import("@content/home/paths.json");

  return (
    <section id="paths" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Quick Paths</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">快速路径</h2>
          <p className="text-lg text-muted-foreground">选择适合你的探索方式</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {data.map((path) => {
            const Icon = iconMap[path.icon as keyof typeof iconMap] || Rocket;
            return (
              <Card key={path.title} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-2xl">{path.emoji}</span>
                    <Icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">{path.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">{path.emphasis}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{path.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
