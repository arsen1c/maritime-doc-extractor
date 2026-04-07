import { env } from "../config/env";

import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAiCompatibleProvider } from "./providers/openai.provider";
import type { LlmProvider } from "./types";

export function createLlmProvider(): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return new GeminiProvider();
    case "openai":
      return new OpenAiCompatibleProvider();
    case "groq":
      return new OpenAiCompatibleProvider("https://api.groq.com/openai/v1");
    case "ollama":
      return new OpenAiCompatibleProvider("http://localhost:11434/v1");
    default:
      return new GeminiProvider();
  }
}

export const llmProvider = createLlmProvider();
