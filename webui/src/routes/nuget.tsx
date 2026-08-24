import { createFileRoute } from "@tanstack/react-router";
import { Copy, Check, Download, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import packageData from "@content/nuget/packages.json";

export const Route = createFileRoute("/nuget")({
  component: NugetPage,
});

function NugetPage() {
  const [copied, setCopied] = useState(false);
  const data = packageData as typeof import("@content/nuget/packages.json");

  const handleCopy = () => {
    navigator.clipboard.writeText(data.corePackage.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">NuGet Package</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            TKW.Framework
          </h1>
          <p className="text-lg text-muted-foreground">
            {data.intro}
          </p>
        </div>

        {/* Install Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              安装方式
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm">{data.corePackage.installCommand}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="ml-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{data.corePackage.description}</p>
          </CardContent>
        </Card>

        {/* Package List */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.packages.map((pkg) => (
            <Card key={pkg.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="mb-2 text-xs">
                  {pkg.category}
                </Badge>
                <p className="text-xs text-muted-foreground">{pkg.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Link to full list */}
        {data.linkToFullList && (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <a href={data.linkToFullList.href} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                {data.linkToFullList.label}
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}