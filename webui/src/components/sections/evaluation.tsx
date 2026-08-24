import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import evaluationData from "@content/home/evaluation.json";

export function EvaluationSection() {
  const data = evaluationData as typeof import("@content/home/evaluation.json");

  return (
    <section id="evaluation" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Agentic Evaluation</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {data.title}
          </h2>
          <p className="text-lg text-muted-foreground">{data.intro}</p>
        </div>

        {/* Framework Comparison */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {data.frameworks.map((fw) => (
            <Card key={fw.name} className={fw.isWinner ? "border-green-500/50 bg-green-500/5" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{fw.name}</span>
                  {fw.isWinner && <Badge className="bg-green-500">Winner</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{fw.score}</span>
                    <span className="text-sm text-muted-foreground">/ {fw.maxScore}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        fw.color === "green" ? "bg-green-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${(fw.score / fw.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trend Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              行业趋势信号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.trendSignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
