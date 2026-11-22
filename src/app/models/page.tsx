import ModelsExplorer from "@/components/ModelsExplorer";

export const metadata = { title: "Models — OneAtlas" };

export default function ModelsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">AI models</h1>
      <p className="mb-6 mt-1 text-neutral-600">
        Browse specs, pricing, capabilities and providers. Filter, sort and select models to compare.
      </p>
      <ModelsExplorer />
    </div>
  );
}