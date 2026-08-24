import { useState } from "react";
import { Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { parseScenario } from "@/lib/markdown";

// 导入所有场景文件
import raw01 from "@content/home/scenarios/01-entity.md?raw";
import raw02 from "@content/home/scenarios/02-service.md?raw";
import raw03 from "@content/home/scenarios/03-wasm-client.md?raw";
import raw04 from "@content/home/scenarios/04-cqrs-viewentity.md?raw";
import raw05 from "@content/home/scenarios/05-user-centric.md?raw";
import raw06 from "@content/home/scenarios/06-auto-registration.md?raw";
import raw07 from "@content/home/scenarios/07-knowledge-docs.md?raw";
import raw08 from "@content/home/scenarios/08-ts-client.md?raw";
import raw09 from "@content/home/scenarios/09-testing-mock.md?raw";
import raw10 from "@content/home/scenarios/10-agentic-skills.md?raw";

const RAW_SCENARIOS = [raw01, raw02, raw03, raw04, raw05, raw06, raw07, raw08, raw09, raw10];

export function ScenariosSection() {
  const scenarios = RAW_SCENARIOS.map(parseScenario).sort((a, b) => a.frontmatter.order - b.frontmatter.order);

  return (
    <section id="scenarios" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">Code Scenarios</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">代码场景示例</h2>
          <p className="text-lg text-muted-foreground">TKW.Framework 核心使用场景，共 {scenarios.length} 个</p>
        </div>

        <Tabs defaultValue={`scenario-${scenarios[0]?.frontmatter.order}`} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {scenarios.slice(0, 5).map((s) => (
              <TabsTrigger key={s.frontmatter.order} value={`scenario-${s.frontmatter.order}`} className="text-xs h-auto py-2 whitespace-normal leading-tight">
                {s.frontmatter.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid w-full grid-cols-5">
            {scenarios.slice(5).map((s) => (
              <TabsTrigger key={s.frontmatter.order} value={`scenario-${s.frontmatter.order}`} className="text-xs h-auto py-2 whitespace-normal leading-tight">
                {s.frontmatter.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {scenarios.map((scenario) => (
            <TabsContent key={scenario.frontmatter.order} value={`scenario-${scenario.frontmatter.order}`} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    {scenario.frontmatter.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{scenario.frontmatter.description}</p>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          language={match[1]}
                          style={oneDark as Record<string, React.CSSProperties>}
                          customStyle={{ borderRadius: "0.5rem", padding: "1rem", fontSize: "0.875rem" }}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}>
                    {/* 仅渲染正文部分 */}
                    {(() => {
                      const raw = RAW_SCENARIOS.find((_, i) => scenarios[i]?.frontmatter.order === scenario.frontmatter.order);
                      if (!raw) return "";
                      // 提取 frontmatter 之后的完整 Markdown 正文
                      const lines = raw.split("\n");
                      let startIdx = 0;
                      for (let i = 0; i < lines.length; i++) {
                        if (lines[i].trim() === "---" && i > 0) {
                          startIdx = i + 1;
                          break;
                        }
                      }
                      return lines.slice(startIdx).join("\n").trim();
                    })()}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
