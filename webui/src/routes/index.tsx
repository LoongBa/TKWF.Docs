import { createFileRoute } from "@tanstack/react-router";
import sectionOrder from "@content/home/sections.json";
import { HeroSection } from "@/components/sections/hero";
import { EvaluationSection } from "@/components/sections/evaluation";
import { WorkflowSection } from "@/components/sections/workflow";
import { PillarsSection } from "@/components/sections/pillars";
import { ScenariosSection } from "@/components/sections/scenarios";
import { PathsSection } from "@/components/sections/paths";
import { FeaturesSection } from "@/components/sections/features";
import { VersionsSection } from "@/components/sections/versions";
import { RoadmapSection } from "@/components/sections/roadmap";

const sectionMap: Record<string, React.FC> = {
  hero: HeroSection,
  evaluation: EvaluationSection,
  workflow: WorkflowSection,
  pillars: PillarsSection,
  scenarios: ScenariosSection,
  paths: PathsSection,
  features: FeaturesSection,
  versions: VersionsSection,
  roadmap: RoadmapSection,
};

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      {sectionOrder.map((key) => {
        const Section = sectionMap[key];
        return Section ? <Section key={key} /> : null;
      })}
    </>
  );
}