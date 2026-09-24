import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const models = {
  fast: anthropic("claude-haiku-4-5-20251001"),
  quality: anthropic("claude-sonnet-4-6"),
} as const;

export function isApiKeyMissing(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !key || key === "your_key_here";
}
