import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import roadmapData from "@content/home/roadmap.json";

export function RoadmapSection() {
  const data = roadmapData as typeof import("@content/home/roadmap.json");

  return (
    <section id="roadmap" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Roadmap</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{data.title}</h2>
          <p className="text-lg text-muted-foreground">{data.intro}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((item) => (
            <Card key={item.direction} className="transition-all hover:shadow-md">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">{item.status}</Badge>
                <CardTitle className="text-base">{item.direction}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
