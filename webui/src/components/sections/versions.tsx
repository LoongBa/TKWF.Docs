import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import versionsData from "@content/home/versions.json";

export function VersionsSection() {
  const data = versionsData as typeof import("@content/home/versions.json");

  return (
    <section id="versions" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Version History</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">版本动态</h2>
          <p className="text-lg text-muted-foreground">TKW.Framework 近期更新记录</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.map((v) => (
                <div key={v.version} className="flex items-start gap-4 p-6">
                  <div className="shrink-0 rounded-full bg-blue-500/10 p-3">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="font-mono text-lg font-bold">{v.version}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {v.date}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
