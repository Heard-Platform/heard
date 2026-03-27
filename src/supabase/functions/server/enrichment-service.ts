import { LlmClient } from "./llm-client.ts";
import { createLlmClient, getLlmProvider, LlmProvider } from "./llm-provider.ts";

export class EnrichmentService {
  protected aiClient: LlmClient;
  protected provider: LlmProvider;

  constructor() {
    this.provider = getLlmProvider();
    this.aiClient = createLlmClient(this.provider);
  }
}
