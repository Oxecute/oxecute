import {
  ACTIVATION_SYSTEM_PROMPT_V1,
  buildActivationUserMessage,
  CHAT_SYSTEM_PROMPT_V1,
  DAY14_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
} from "@/lib/conexa/prompts";

const MODEL = "claude-sonnet-4-6";

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

export async function callAnthropic(params: {
  system: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  signal?: AbortSignal;
}): Promise<{ text: string; tokens_in: number; tokens_out: number; latency_ms: number }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");

  const started = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: params.max_tokens,
      system: params.system,
      messages: params.messages,
    }),
    signal: params.signal,
  });

  const latency_ms = Date.now() - started;
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic error ${res.status}`);
  }

  const text = data.content?.[0]?.type === "text" ? data.content[0].text || "" : "";
  return {
    text,
    tokens_in: data.usage?.input_tokens ?? 0,
    tokens_out: data.usage?.output_tokens ?? 0,
    latency_ms,
  };
}

export async function conexaSynthesis(userMessage: string, signal?: AbortSignal) {
  return callAnthropic({
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    max_tokens: 1200,
    signal,
  });
}

export async function conexaActivation(
  fields: Parameters<typeof buildActivationUserMessage>[0],
  signal?: AbortSignal,
) {
  const userMsg = buildActivationUserMessage(fields);
  return callAnthropic({
    system: ACTIVATION_SYSTEM_PROMPT_V1,
    messages: [{ role: "user", content: userMsg }],
    max_tokens: 1800,
    signal,
  });
}

export async function conexaDay14Read(userMessage: string, signal?: AbortSignal) {
  return callAnthropic({
    system: DAY14_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    max_tokens: 400,
    signal,
  });
}

export async function conexaChat(
  messages: AnthropicMessage[],
  signal?: AbortSignal,
) {
  return callAnthropic({
    system: CHAT_SYSTEM_PROMPT_V1,
    messages,
    max_tokens: 300,
    signal,
  });
}
