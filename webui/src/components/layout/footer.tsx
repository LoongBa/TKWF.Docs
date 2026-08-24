import { Github } from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import footerData from "@content/shared/footer.json";

export function Footer() {
  const data = footerData as typeof import("@content/shared/footer.json");
  const year = data.year === "dynamic" ? new Date().getFullYear() : data.year;

  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Copyright & Tagline */}
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              {data.copyright} © {year}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">{data.tagline}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {data.links.map((link) => {
              if (link.isBadge) {
                // 构建状态徽章 - 使用 site.json 中的 buildBadgeUrl
                return (
                  <a
                    key={link.label}
                    href={link.href === "BUILD_BADGE" ? undefined : link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img
                      src="https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg"
                      alt={link.label}
                      className="h-5"
                    />
                  </a>
                );
              }

              const Icon = link.icon ? iconMap[link.icon as keyof typeof iconMap] : null;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
