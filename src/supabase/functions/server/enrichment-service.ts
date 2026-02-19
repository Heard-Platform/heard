import { OpenAiClient } from "./openai-client.ts";

export class EnrichmentService {
  protected aiClient;

  constructor() {
    this.aiClient = new OpenAiClient();
  }
}