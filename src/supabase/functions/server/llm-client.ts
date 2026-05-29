import { AiPrompt } from "./types.tsx";
import { LlmProvider, NormalizedUsage } from "./llm-types.ts";
import { recordLlmUsage } from "./llm-usage-logger.ts";

export interface LlmCallContext {
  userId?: string;
  endpoint: string;
}

export interface LlmClient {
  complete(prompt: AiPrompt, context: LlmCallContext): Promise<string>;
  completeJson(prompt: AiPrompt, context: LlmCallContext): Promise<string>;
}

export interface LlmApiResult {
  content: string;
  usage: NormalizedUsage;
}

export abstract class BaseLlmClient implements LlmClient {
  protected abstract readonly provider: LlmProvider;
  protected abstract readonly model: string;

  async complete(prompt: AiPrompt, context: LlmCallContext): Promise<string> {
    return this.completeAndRecord(prompt, false, context);
  }

  async completeJson(prompt: AiPrompt, context: LlmCallContext): Promise<string> {
    return this.completeAndRecord(prompt, true, context);
  }

  protected abstract callApi(prompt: AiPrompt, json: boolean): Promise<LlmApiResult>;

  private async completeAndRecord(
    prompt: AiPrompt,
    json: boolean,
    context: LlmCallContext,
  ): Promise<string> {
    const { content, usage } = await this.callApi(prompt, json);
    recordLlmUsage({
      provider: this.provider,
      model: this.model,
      userId: context.userId,
      endpoint: context.endpoint,
      ...usage,
    });
    return content;
  }
}
