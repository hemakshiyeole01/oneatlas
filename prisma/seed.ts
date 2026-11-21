import "dotenv/config";
import { PrismaClient, ModelType } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- helpers ----------
function hash(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clamp = (n: number) => Math.max(1, Math.min(99, n));
const round = (n: number, d = 4) => Number(n.toFixed(d));

// ---------- labs ----------
const labs = [
  { name: "OpenAI", slug: "openai", country: "USA", website: "https://openai.com", description: "Creator of the GPT and o-series models." },
  { name: "Anthropic", slug: "anthropic", country: "USA", website: "https://anthropic.com", description: "AI safety company behind the Claude family." },
  { name: "Google DeepMind", slug: "google", country: "USA", website: "https://deepmind.google", description: "Google's AI research lab, makers of Gemini and Gemma." },
  { name: "Meta AI", slug: "meta", country: "USA", website: "https://ai.meta.com", description: "Publisher of the open-weights Llama models." },
  { name: "Mistral AI", slug: "mistral", country: "France", website: "https://mistral.ai", description: "European lab building open and commercial models." },
  { name: "DeepSeek", slug: "deepseek", country: "China", website: "https://deepseek.com", description: "Lab known for efficient open-weights reasoning models." },
  { name: "xAI", slug: "xai", country: "USA", website: "https://x.ai", description: "Creator of the Grok models." },
  { name: "Alibaba Qwen", slug: "qwen", country: "China", website: "https://qwenlm.github.io", description: "Alibaba's Qwen open model family." },
  { name: "Cohere", slug: "cohere", country: "Canada", website: "https://cohere.com", description: "Enterprise-focused language and retrieval models." },
  { name: "Moonshot AI", slug: "moonshot", country: "China", website: "https://moonshot.ai", description: "Developer of the Kimi models." },
  { name: "Microsoft", slug: "microsoft", country: "USA", website: "https://microsoft.com/ai", description: "Research lab behind the small Phi models." },
];

// ---------- providers ----------
const providers = [
  { name: "OpenAI", slug: "openai", website: "https://platform.openai.com", description: "First-party OpenAI API." },
  { name: "Anthropic", slug: "anthropic", website: "https://console.anthropic.com", description: "First-party Anthropic API." },
  { name: "Google AI Studio", slug: "google-ai", website: "https://aistudio.google.com", description: "Google's first-party Gemini API." },
  { name: "Google Vertex AI", slug: "vertex", website: "https://cloud.google.com/vertex-ai", description: "Managed models on Google Cloud." },
  { name: "AWS Bedrock", slug: "bedrock", website: "https://aws.amazon.com/bedrock", description: "Managed models on AWS." },
  { name: "Azure AI Foundry", slug: "azure", website: "https://azure.microsoft.com", description: "Managed models on Microsoft Azure." },
  { name: "Mistral API", slug: "mistral", website: "https://console.mistral.ai", description: "First-party Mistral platform." },
  { name: "DeepSeek API", slug: "deepseek", website: "https://platform.deepseek.com", description: "First-party DeepSeek platform." },
  { name: "xAI API", slug: "xai", website: "https://x.ai/api", description: "First-party xAI API." },
  { name: "Alibaba Cloud", slug: "alibaba", website: "https://www.alibabacloud.com", description: "Model Studio for Qwen models." },
  { name: "Cohere API", slug: "cohere", website: "https://dashboard.cohere.com", description: "First-party Cohere platform." },
  { name: "Moonshot API", slug: "moonshot", website: "https://platform.moonshot.ai", description: "First-party Kimi API." },
  { name: "Together AI", slug: "together", website: "https://together.ai", description: "Fast inference for open models." },
  { name: "Fireworks AI", slug: "fireworks", website: "https://fireworks.ai", description: "Production inference for open models." },
  { name: "Groq", slug: "groq", website: "https://groq.com", description: "Very low-latency inference hardware." },
  { name: "DeepInfra", slug: "deepinfra", website: "https://deepinfra.com", description: "Low-cost hosted open models." },
  { name: "OpenRouter", slug: "openrouter", website: "https://openrouter.ai", description: "Unified API across many providers." },
];

// ---------- benchmarks ----------
type BenchDef = {
  name: string; slug: string; category: string; description: string;
  visionOnly?: boolean;
  f: (tier: number, reasoning: boolean, coder: boolean) => number;
};
const benchDefs: BenchDef[] = [
  { name: "MMLU-Pro", slug: "mmlu-pro", category: "knowledge", description: "Harder multi-task knowledge benchmark.", f: (t) => t - 6 },
  { name: "GPQA Diamond", slug: "gpqa-diamond", category: "reasoning", description: "Graduate-level science questions.", f: (t, r) => t - 22 + (r ? 10 : 0) },
  { name: "HumanEval", slug: "humaneval", category: "coding", description: "Python function synthesis problems.", f: (t, _r, c) => t + 12 + (c ? 4 : 0) },
  { name: "SWE-bench Verified", slug: "swe-bench-verified", category: "coding", description: "Resolving real GitHub issues.", f: (t, r, c) => t - 38 + (r ? 5 : 0) + (c ? 8 : 0) },
  { name: "LiveCodeBench", slug: "livecodebench", category: "coding", description: "Fresh competitive programming problems.", f: (t, r, c) => t - 25 + (r ? 8 : 0) + (c ? 6 : 0) },
  { name: "MATH-500", slug: "math-500", category: "math", description: "Competition-style math problems.", f: (t, r) => t + 8 + (r ? 8 : 0) },
  { name: "AIME 2025", slug: "aime-2025", category: "math", description: "American Invitational Mathematics Exam.", f: (t, r) => t - 40 + (r ? 25 : 0) },
  { name: "MMMU", slug: "mmmu", category: "multimodal", description: "College-level multimodal understanding.", visionOnly: true, f: (t) => t - 12 },
];

// ---------- models ----------
// flags: r=reasoning t=tools v=vision s=structured output o=open weights d=deprecated e=embedding a=audio/video input
type Row = [lab: string, name: string, date: string, ctx: number, maxOut: number, tier: number, pIn: number, pOut: number, flags: string, prov: string[]];
const CLOSED_OA = ["openai", "azure", "openrouter"];
const CLOSED_AN = ["anthropic", "bedrock", "vertex", "openrouter"];
const OPEN_HOST = ["together", "fireworks", "deepinfra", "openrouter"];

const rows: Row[] = [
  ["openai", "GPT-5", "2025-08-07", 400000, 128000, 92, 1.25, 10, "rtvs", CLOSED_OA],
  ["openai", "GPT-4.1", "2025-04-14", 1047576, 32768, 84, 2, 8, "tvs", CLOSED_OA],
  ["openai", "GPT-4o", "2024-05-13", 128000, 16384, 78, 2.5, 10, "tvsa", CLOSED_OA],
  ["openai", "GPT-4o mini", "2024-07-18", 128000, 16384, 68, 0.15, 0.6, "tvs", CLOSED_OA],
  ["openai", "o1", "2024-12-05", 200000, 100000, 86, 15, 60, "rtvsd", CLOSED_OA],
  ["openai", "o3-mini", "2025-01-31", 200000, 100000, 82, 1.1, 4.4, "rts", CLOSED_OA],
  ["openai", "gpt-oss-120b", "2025-08-05", 131072, 32768, 80, 0.15, 0.6, "rtso", ["groq", ...OPEN_HOST]],
  ["openai", "text-embedding-3-large", "2024-01-25", 8191, 0, 0, 0.13, 0, "e", ["openai", "azure"]],

  ["anthropic", "Claude Opus 4.1", "2025-08-05", 200000, 32000, 90, 15, 75, "rtvs", CLOSED_AN],
  ["anthropic", "Claude Sonnet 4", "2025-05-22", 200000, 64000, 87, 3, 15, "rtvs", CLOSED_AN],
  ["anthropic", "Claude 3.7 Sonnet", "2025-02-24", 200000, 64000, 84, 3, 15, "rtvs", CLOSED_AN],
  ["anthropic", "Claude 3.5 Sonnet", "2024-06-20", 200000, 8192, 80, 3, 15, "tvd", CLOSED_AN],
  ["anthropic", "Claude 3.5 Haiku", "2024-10-22", 200000, 8192, 66, 0.8, 4, "tv", CLOSED_AN],

  ["google", "Gemini 2.5 Pro", "2025-06-17", 1048576, 65536, 91, 1.25, 10, "rtvsa", ["google-ai", "vertex", "openrouter"]],
  ["google", "Gemini 2.5 Flash", "2025-06-17", 1048576, 65536, 83, 0.3, 2.5, "rtvsa", ["google-ai", "vertex", "openrouter"]],
  ["google", "Gemini 2.0 Flash", "2025-02-05", 1048576, 8192, 74, 0.1, 0.4, "tvsa", ["google-ai", "vertex", "openrouter"]],
  ["google", "Gemma 3 27B", "2025-03-12", 131072, 8192, 66, 0.1, 0.2, "vso", ["deepinfra", "together", "openrouter"]],

  ["meta", "Llama 4 Maverick", "2025-04-05", 1048576, 16384, 77, 0.2, 0.6, "tvso", ["groq", ...OPEN_HOST]],
  ["meta", "Llama 4 Scout", "2025-04-05", 10000000, 16384, 72, 0.1, 0.3, "tvso", ["groq", ...OPEN_HOST]],
  ["meta", "Llama 3.3 70B Instruct", "2024-12-06", 131072, 8192, 70, 0.6, 0.6, "tso", ["groq", ...OPEN_HOST]],
  ["meta", "Llama 3.1 405B Instruct", "2024-07-23", 131072, 4096, 76, 3, 3, "tso", OPEN_HOST],

  ["mistral", "Mistral Large 2", "2024-07-24", 128000, 8192, 72, 2, 6, "ts", ["mistral", "azure", "bedrock", "vertex", "openrouter"]],
  ["mistral", "Mistral Small 3", "2025-01-30", 32768, 8192, 64, 0.1, 0.3, "tso", ["mistral", "together", "deepinfra", "openrouter"]],
  ["mistral", "Codestral", "2025-01-13", 256000, 8192, 68, 0.3, 0.9, "ts", ["mistral", "openrouter"]],
  ["mistral", "Mixtral 8x22B", "2024-04-17", 65536, 8192, 58, 0.9, 0.9, "tod", OPEN_HOST],

  ["deepseek", "DeepSeek-V3.1", "2025-08-21", 128000, 32768, 82, 0.27, 1.0, "rtso", ["deepseek", ...OPEN_HOST]],
  ["deepseek", "DeepSeek-V3", "2024-12-26", 128000, 8192, 78, 0.27, 1.1, "tso", ["deepseek", ...OPEN_HOST]],
  ["deepseek", "DeepSeek-R1", "2025-01-20", 128000, 32768, 84, 0.55, 2.19, "rso", ["deepseek", ...OPEN_HOST]],
  ["deepseek", "DeepSeek-R1 Distill Llama 70B", "2025-01-20", 131072, 16384, 70, 0.1, 0.4, "rso", ["groq", "together", "deepinfra", "openrouter"]],

  ["xai", "Grok 4", "2025-07-09", 256000, 64000, 90, 3, 15, "rtvs", ["xai", "openrouter"]],
  ["xai", "Grok 3", "2025-02-17", 131072, 8192, 84, 3, 15, "rts", ["xai", "openrouter"]],
  ["xai", "Grok 3 mini", "2025-02-17", 131072, 8192, 76, 0.3, 0.5, "rts", ["xai", "openrouter"]],
  ["xai", "Grok 2", "2024-08-13", 131072, 8192, 72, 2, 10, "tvd", ["xai", "openrouter"]],

  ["qwen", "Qwen3 235B A22B", "2025-04-29", 131072, 32768, 82, 0.2, 0.6, "rtso", ["alibaba", ...OPEN_HOST]],
  ["qwen", "Qwen3 Coder 480B", "2025-07-22", 262144, 65536, 80, 1, 5, "tso", ["alibaba", ...OPEN_HOST]],
  ["qwen", "QwQ-32B", "2025-03-06", 131072, 32768, 74, 0.15, 0.4, "rso", ["alibaba", ...OPEN_HOST]],
  ["qwen", "Qwen2.5 72B Instruct", "2024-09-19", 131072, 8192, 70, 0.35, 0.4, "tso", ["alibaba", ...OPEN_HOST]],
  ["qwen", "Qwen2.5 Coder 32B", "2024-11-11", 131072, 8192, 68, 0.07, 0.16, "tso", ["alibaba", ...OPEN_HOST]],

  ["cohere", "Command A", "2025-03-13", 256000, 8192, 70, 2.5, 10, "ts", ["cohere", "azure", "openrouter"]],
  ["cohere", "Command R+", "2024-08-30", 128000, 4096, 62, 2.5, 10, "ts", ["cohere", "bedrock", "azure", "openrouter"]],
  ["cohere", "Embed v4", "2025-04-15", 128000, 0, 0, 0.12, 0, "e", ["cohere", "bedrock"]],

  ["moonshot", "Kimi K2", "2025-07-11", 131072, 16384, 80, 0.6, 2.5, "tso", ["moonshot", "groq", "together", "fireworks", "openrouter"]],
  ["microsoft", "Phi-4", "2024-12-12", 16384, 4096, 62, 0.07, 0.14, "o", ["azure", "deepinfra", "together", "openrouter"]],
];

// ---------- main ----------
async function main() {
  console.log("Clearing old data...");
  await prisma.benchmarkScore.deleteMany();
  await prisma.modelProvider.deleteMany();
  await prisma.model.deleteMany();
  await prisma.benchmark.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.lab.deleteMany();

  await prisma.lab.createMany({ data: labs });
  await prisma.provider.createMany({ data: providers });
  await prisma.benchmark.createMany({
    data: benchDefs.map(({ name, slug, category, description }) => ({ name, slug, category, description })),
  });

  const labRows = await prisma.lab.findMany();
  const labId = Object.fromEntries(labRows.map((l) => [l.slug, l.id]));
  const labName = Object.fromEntries(labRows.map((l) => [l.slug, l.name]));
  const providerRows = await prisma.provider.findMany();
  const providerId = Object.fromEntries(providerRows.map((p) => [p.slug, p.id]));
  const benchRows = await prisma.benchmark.findMany();
  const benchId = Object.fromEntries(benchRows.map((b) => [b.slug, b.id]));

  const built = rows.map(([lab, name, date, ctx, maxOut, tier, pIn, pOut, flags, prov]) => {
    const has = (c: string) => flags.includes(c);
    const slug = slugify(name);
    const type = has("e") ? ModelType.EMBEDDING : has("v") ? ModelType.MULTIMODAL : ModelType.TEXT;
    const inputModalities = has("e") ? ["text"] : ["text", ...(has("v") ? ["image"] : []), ...(has("a") ? ["audio", "video"] : [])];
    const outputModalities = has("e") ? ["embedding"] : ["text"];
    return {
      slug, name, tier, pIn, pOut, prov,
      reasoning: has("r"), vision: has("v"), embedding: has("e"),
      coder: /coder|codestral/i.test(name),
      data: {
        name, slug,
        description: `${name} is ${has("o") ? "an open-weights" : "a proprietary"} ${has("e") ? "embedding" : "language"} model from ${labName[lab]}. Specs and prices are sample data for the OneAtlas demo.`,
        type,
        contextWindow: ctx,
        maxOutput: maxOut,
        inputModalities,
        outputModalities,
        supportsReasoning: has("r"),
        supportsTools: has("t"),
        supportsVision: has("v"),
        supportsStructuredOutput: has("s"),
        openWeights: has("o"),
        deprecated: has("d"),
        releasedAt: new Date(date),
        labId: labId[lab],
      },
    };
  });

  await prisma.model.createMany({ data: built.map((b) => b.data) });
  const modelId = Object.fromEntries((await prisma.model.findMany()).map((m) => [m.slug, m.id]));

  // provider listings with prices
  const listings = built.flatMap((b) =>
    b.prov.map((p, i) => {
      const factor = i === 0 || p === "openrouter" ? 1 : 0.9 + (hash(b.slug + p) % 25) / 100;
      const inputPrice = round(b.pIn * factor);
      return {
        modelId: modelId[b.slug],
        providerId: providerId[p],
        inputPrice,
        outputPrice: round(b.pOut * factor),
        cacheReadPrice: b.embedding ? null : round(inputPrice * 0.1),
      };
    })
  );
  await prisma.modelProvider.createMany({ data: listings });

  // benchmark scores
  const scores = built.flatMap((b) => {
    if (b.tier === 0) return [];
    return benchDefs.flatMap((bd) => {
      if (bd.visionOnly && !b.vision) return [];
      if (bd.slug !== "mmlu-pro" && hash(b.slug + "skip" + bd.slug) % 7 === 0) return [];
      const jitter = (hash(b.slug + bd.slug) % 81) / 10 - 4;
      const score = round(clamp(bd.f(b.tier, b.reasoning, b.coder) + jitter), 1);
      return [{ modelId: modelId[b.slug], benchmarkId: benchId[bd.slug], score }];
    });
  });
  await prisma.benchmarkScore.createMany({ data: scores });

  console.log(`Seeded: ${labs.length} labs, ${providers.length} providers, ${built.length} models, ${listings.length} provider listings, ${benchDefs.length} benchmarks, ${scores.length} scores.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());