import { Menu, X, Github, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { iconMap } from "@/lib/icon-map";
import navData from "@content/shared/nav.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const data = navData as typeof import("@content/shared/nav.json");

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === "system") return "跟随系统";
    if (theme === "dark") return "深色";
    return "浅色";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            TKW.Framework
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <ul className="flex items-center gap-1">
            {data.links.map((item) => (
              <li key={item.href}>
                {item.type === "spa" ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={item.href} className="text-muted-foreground hover:text-foreground">
                      {item.label}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      {item.label}
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {/* Right side actions */}
          <div className="ml-4 flex items-center gap-2 border-l pl-4">
            {/* GitHub link from externalLinks */}
            {data.externalLinks.map((ext) => {
              const Icon = iconMap[ext.icon as keyof typeof iconMap] || Github;
              return (
                <Button key={ext.label} variant="ghost" size="icon" asChild>
                  <a
                    href={ext.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </Button>
              );
            })}

            {/* Theme switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  {getThemeIcon()}
                  <span className="hidden lg:inline">{getThemeLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                  <Sun className="h-4 w-4" />
                  <span>浅色</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                  <Moon className="h-4 w-4" />
                  <span>深色</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>跟随系统</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </nav>

      {/* Mobile nav */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-1 border-t bg-background/95 px-6 pb-4 pt-2 backdrop-blur-sm">
          {data.links.map((item) => (
            <li key={item.href}>
              {item.type === "spa" ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  asChild
                >
                  <Link to={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  asChild
                >
                  <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                    {item.label}
                  </a>
                </Button>
              )}
            </li>
          ))}
          {data.externalLinks.map((ext) => {
            const Icon = iconMap[ext.icon as keyof typeof iconMap] || Github;
            return (
              <li key={ext.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  asChild
                >
                  <a
                    href={ext.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {ext.label}
                  </a>
                </Button>
              </li>
            );
          })}
          <li>
            <div className="flex gap-2 pt-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                浅色
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                深色
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("system")}
              >
                <Monitor className="mr-2 h-4 w-4" />
                系统
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
}
