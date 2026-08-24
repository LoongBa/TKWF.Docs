import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { iconMap } from "@/lib/icon-map";
import layerData from "@content/architecture/layers.json";

export const Route = createFileRoute("/architecture")({
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const data = layerData as typeof import("@content/architecture/layers.json");

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Architecture</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            框架架构
          </h1>
          <p className="text-lg text-muted-foreground">
            {data.intro}
          </p>
        </div>

        {/* Layer Diagram */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold">分层架构</h2>
          <div className="space-y-4">
            {data.layers.map((layer) => {
              const Icon = iconMap[layer.icon as keyof typeof iconMap];
              return (
                <Card key={layer.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{layer.name}</CardTitle>
                        <CardDescription>{layer.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}