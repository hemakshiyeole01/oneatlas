import { Suspense } from "react";
import CompareView from "@/components/CompareView";
import { Loading } from "@/components/ui";

export const metadata = { title: "Compare models — OneAtlas" };

export default function ComparePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Compare models</h1>
      <p className="mb-6 mt-1 text-neutral-600">Side by side pricing, context, capabilities and benchmarks.</p>
      <Suspense fallback={<Loading />}>
        <CompareView />
      </Suspense>
    </div>
  );
}