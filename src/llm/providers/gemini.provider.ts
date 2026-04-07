import { GoogleGenAI } from "@google/genai";

import { env } from "../../config/env";
import type { LlmExtractInput, LlmProvider, LlmTextInput } from "../types";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const error = new Error("LLM request timed out");
      error.name = "AbortError";
      setTimeout(() => reject(error), timeoutMs);
    }),
  ]);
}

export class GeminiProvider implements LlmProvider {
  private readonly client = new GoogleGenAI({ apiKey: env.LLM_API_KEY });

  async extractDocument(input: LlmExtractInput) {
    const contents = input.parts.map((part) => {
      if (part.type === "text") {
        return { text: part.text };
      }

      return {
        inlineData: {
          mimeType: part.mimeType,
          data: part.dataBase64,
        },
      };
    });

    const response = await withTimeout(
      this.client.models.generateContent({
        model: env.LLM_MODEL,
        contents: [{ role: "user", parts: [...contents, { text: input.prompt }] }],
      }),
      input.timeoutMs,
    );

    return { rawText: response.text ?? "" };
  }

  async completeText(input: LlmTextInput) {
    const response = await withTimeout(
      this.client.models.generateContent({
        model: env.LLM_MODEL,
        contents: input.prompt,
      }),
      input.timeoutMs,
    );

    return { rawText: response.text ?? "" };
  }

  async healthCheck() {
    return env.LLM_API_KEY ? "OK" : "DEGRADED";
  }
}
