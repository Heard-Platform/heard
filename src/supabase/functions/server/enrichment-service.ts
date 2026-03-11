import { LlmClient } from "./llm-client.ts";
import { createLlmClient } from "./llm-provider.ts";

export class EnrichmentService {
  protected aiClient: LlmClient;

  constructor() {
    this.aiClient = createLlmClient();
  }
}
