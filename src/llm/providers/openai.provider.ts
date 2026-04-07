import OpenAI from "openai";

import { env } from "../../config/env";
import type { LlmExtractInput, LlmProvider, LlmTextInput } from "../types";

export class OpenAiCompatibleProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor(baseURL?: string) {
    this.client = new OpenAI({
      apiKey: env.LLM_API_KEY,
      baseURL,
    });
  }

  async extractDocument(input: LlmExtractInput) {
    const content = input.parts.map((part) => {
      if (part.type === "text") {
        return { type: "input_text" as const, text: part.text };
      }

      return {
        type: "input_image" as const,
        image_url: `data:${part.mimeType};base64,${part.dataBase64}`,
        detail: "high" as const,
      };
    });

    const response = await this.client.responses.create({
      model: env.LLM_MODEL,
      input: [
        {
          role: "user",
          content: [...content, { type: "input_text", text: input.prompt }],
        },
      ],
    });

    return { rawText: response.output_text };
  }

  async completeText(input: LlmTextInput) {
    const response = await this.client.responses.create({
      model: env.LLM_MODEL,
      input: input.prompt,
    });

    return { rawText: response.output_text };
  }

  async healthCheck() {
    return env.LLM_API_KEY ? "OK" : "DEGRADED";
  }
}
