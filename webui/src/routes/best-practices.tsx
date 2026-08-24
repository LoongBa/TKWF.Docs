import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { iconMap } from "@/lib/icon-map";
import practicesData from "@content/best-practices/practices.json";

export const Route = createFileRoute("/best-practices")({
  component: BestPracticesPage,
});

function BestPracticesPage() {
  const data = practicesData as typeof import("@content/best-practices/practices.json");

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Best Practices</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            最佳实践
          </h1>
          <p className="text-lg text-muted-foreground">
            TKW.Framework 的使用指南与代码示例
          </p>
        </div>

        {/* Sections */}
        {data.sections.map((section, sectionIndex) => {
          const Icon = iconMap[section.icon as keyof typeof iconMap];
          const hasCodeExamples = section.items.some((item) => item.code);

          return (
            <section key={section.title} className={sectionIndex > 0 ? "mt-16" : ""}>
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
                {Icon && <Icon className="h-6 w-6" />}
                {section.title}
              </h2>

              {hasCodeExamples ? (
                // 有代码示例的 Section，使用 Tabs
                <Tabs defaultValue={`item-0`} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {section.items.map((item, index) => (
                      <TabsTrigger key={index} value={`item-${index}`}>
                        {item.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {section.items.map((item, index) => (
                    <TabsContent key={index} value={`item-${index}`} className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SyntaxHighlighter
                            language="csharp"
                            style={oneDark}
                            customStyle={{
                              borderRadius: "0.5rem",
                              padding: "1rem",
                              fontSize: "0.875rem",
                              lineHeight: "1.5",
                            }}
                          >
                            {item.code}
                          </SyntaxHighlighter>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                // 无代码示例的 Section，使用列表
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-5 w-5" />}
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item.title} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}