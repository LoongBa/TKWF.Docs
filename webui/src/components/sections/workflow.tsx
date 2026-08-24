import { User, Bot, Settings, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import workflowData from "@content/home/workflow.json";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const iconMap = { user: User, bot: Bot, settings: Settings, "refresh-cw": RefreshCw };

export function WorkflowSection() {
  const data = workflowData as typeof import("@content/home/workflow.json");

  return (
    <section id="workflow" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Workflow</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{data.title}</h2>
          <blockquote className="mx-auto mb-6 max-w-3xl border-l-4 border-blue-500 pl-4 text-lg italic text-muted-foreground">
            "{data.quote}"
            <footer className="mt-2 text-sm not-italic text-muted-foreground/70">— {data.quoteAuthor}</footer>
          </blockquote>
          <p className="text-lg text-muted-foreground">{data.intro}</p>
        </div>

        {/* Steps */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {data.steps.map((step) => {
            const Icon = iconMap[step.icon as keyof typeof iconMap] || Settings;
            return (
              <Card key={step.label} className="text-center">
                <CardContent className="pt-6">
                  <Icon className="mx-auto mb-4 h-10 w-10 text-blue-500" />
                  <h3 className="mb-1 text-lg font-semibold">{step.label}</h3>
                  <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Outputs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>编译期自动产出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.outputs.map((output) => (
                <div key={output} className="rounded-lg border bg-muted/50 p-3 text-center text-sm">
                  {output}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Example */}
        <Card>
          <CardHeader>
            <CardTitle>{data.codeExample.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <SyntaxHighlighter
              language={data.codeExample.language}
              style={oneDark}
              customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
            >
              {data.codeExample.code}
            </SyntaxHighlighter>
          </CardContent>
        </Card>

        {/* Summary & Principle */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{data.principle}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
