import { LlmClient } from "./llm-client.ts";
import { createLlmClient, getLlmProvider, LlmProvider } from "./llm-provider.ts";
import { createRoom, saveStatement } from "./kv-utils.tsx";
import { createNewRoomData } from "./room-utils.ts";
import { ONE_WEEK_MS } from "./time-utils.ts";
import { generateId } from "./utils.tsx";

export class EnrichmentService {
  protected aiClient: LlmClient;
  protected provider: LlmProvider;
  protected author = "enrichment-service";

  constructor() {
    this.provider = getLlmProvider();
    this.aiClient = createLlmClient(this.provider);
  }

  protected async publishRoom(
    topic: string,
    statements: string[],
    options: { subHeard: string; imageUrl?: string; description?: string },
  ): Promise<string> {
    const room = createNewRoomData({
      id: generateId(),
      topic,
      description: options.description,
      participants: [],
      hostId: this.author,
      subHeard: options.subHeard,
      endTime: Date.now() + ONE_WEEK_MS,
      allowAnonymous: true,
      imageUrl: options.imageUrl,
    });

    await createRoom(room);

    await Promise.all(
      statements.map((text) =>
        saveStatement({
          id: generateId(),
          text,
          author: this.author,
          agrees: 0,
          disagrees: 0,
          passes: 0,
          superAgrees: 0,
          roomId: room.id,
          timestamp: Date.now(),
          round: 1,
          voters: {},
        })
      ),
    );

    return room.id;
  }
}
