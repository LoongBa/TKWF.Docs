import { ArrowDown, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroData from "@content/home/hero.json";

export function HeroSection() {
  const data = heroData as typeof import("@content/home/hero.json");

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {data.badges.map((badge) => (
            <Badge
              key={badge.label}
              variant="secondary"
              className={`bg-${badge.color}-500/10 text-${badge.color}-700 border-${badge.color}-500/20`}
            >
              {badge.label} {badge.value}
            </Badge>
          ))}
        </div>

        <div className="space-y-4">
          <h1 className="bg-gradient-to-r from-foreground via-blue-500 to-purple-500 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl md:text-6xl">
            TKW.Framework
          </h1>
          <p className="mx-auto max-w-3xl text-xl font-semibold text-muted-foreground">
            Agentic Engineering <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">最友好</span>的软件开发框架
          </p>
          <p className="mx-auto max-w-3xl text-xl font-semibold text-muted-foreground">
            让 Agentic Engineering <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">更可控、更可靠</span>
          </p>
          <p className="mx-auto max-w-3xl text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            开发者提供需求 → 框架支持并约束 → AI 自动实现
          </p>
          <p className="mx-auto max-w-2xl text-lg italic text-muted-foreground">
            {data.tagline}
          </p>
        </div>

        {/* CTA Buttons - 按规范使用 3 个 docfx 链接 */}
        <div className="flex flex-wrap justify-center gap-3">
          {data.ctas.map((cta) => (
            <Button
              key={cta.label}
              size="lg"
              variant={cta.variant === "primary" ? "default" : "outline"}
              asChild
            >
              <a href={cta.href} target="_blank" rel="noopener noreferrer">
                {cta.label}
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollTo("#evaluation")}
        className="absolute bottom-8 animate-bounce text-muted-foreground transition-colors hover:text-foreground"
        aria-label="向下滚动"
      >
        <ArrowDown size={24} />
      </button>
    </section>
  );
}
