/**
 * Opt-in, keyless in-browser LLM loader for the companion.
 *
 * We never bundle the model runtime: WebLLM is pulled from a CDN ESM at the
 * moment the user chooses to "wake" the robot (webpackIgnore keeps it out of
 * the build), and the model weights download into the browser cache. Nothing
 * leaves the device and there are no API keys, in keeping with the app's
 * keyless, honest contract. If WebGPU is missing or anything fails, the caller
 * falls back to the deterministic scripted answers.
 */

// A small instruction-tuned model: good enough to phrase grounded answers,
// small enough to download and run on consumer GPUs.
export const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const MODEL_LABEL = "Qwen2.5 0.5B (open source, runs on your GPU)";

/** WebGPU is required for in-browser inference. */
export function webgpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

// The engine instance is untyped (remote module); we keep it behind this alias.
export type MlcEngine = {
  chat: {
    completions: {
      create: (opts: unknown) => Promise<unknown>;
    };
  };
};

/** Download + initialise the model, reporting progress (0..1) and a status line. */
export async function loadEngine(
  onProgress: (progress: number, text: string) => void,
): Promise<MlcEngine> {
  // @ts-expect-error remote ESM module, resolved at runtime and not bundled.
  const webllm = await import(/* webpackIgnore: true */ "https://esm.run/@mlc-ai/web-llm");
  const engine = await webllm.CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (r: { progress?: number; text?: string }) =>
      onProgress(r.progress ?? 0, r.text ?? ""),
  });
  return engine as MlcEngine;
}

/** Stream a reply token-by-token given a system prompt and a grounded user turn. */
export async function* streamReply(
  engine: MlcEngine,
  system: string,
  user: string,
): AsyncGenerator<string> {
  const stream = (await engine.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 240,
    stream: true,
  })) as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}
