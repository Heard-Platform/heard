import { OpenAiClient } from "./openai-client.tsx";

export class EnrichmentService {
    protected aiClient;

    constructor() {
        this.aiClient = new OpenAiClient();
    }
}