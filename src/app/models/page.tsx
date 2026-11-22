import Hero from "@/components/Hero";
import ModelsExplorer from "@/components/ModelsExplorer";

export const metadata = { title: "Models — OneAtlas" };

export default function ModelsPage() {
  return (
    <div>
      <Hero />
      <ModelsExplorer />
    </div>
  );
}