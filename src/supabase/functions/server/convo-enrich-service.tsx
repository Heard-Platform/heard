import { generateAiPromptForNewStatementFromConvoData } from "./ai-prompt-utils.tsx";
import { EnrichmentService } from "./enrichment-service.tsx";
import { mockRooms, mockStatements } from "./mock-data.ts";
import { DebateRoom, Statement } from "./types.tsx";

export class ConvoEnrichService extends EnrichmentService {
    async enrichAppropriateConvos() {
        // TODO: remove mock data retrieval
        const currentRooms = mockRooms;
        const currentStatements = mockStatements;

        //TODO: get all rooms created in the last 48 hours, add them to currentRooms
        //TODO: get all statements created in the last 48 hours, add them to currentStatements
        //TODO: get all votes from the last 48 hours, and add their statements to currentStatements
        
        for (const room of currentRooms) {
            //TODO: add if statements to determine which conversations should be enriched 
            // based on total number of responses, number of AI responses, activity, etc.
            await this.enrichConvo({
                room,
                statements: currentStatements[room.id],
            });
        }
    }

    async enrichConvo(convoData: {
        room: DebateRoom,
        statements: Statement[],
    }): Promise<any> {
        const aiPrompts = generateAiPromptForNewStatementFromConvoData(convoData);

        const response = await this.aiClient.complete({ systemPrompt: aiPrompts.systemPrompt, userPrompt: aiPrompts.userPrompt });
        const newStatementText = response.trim();
        const newStatementId = crypto.randomUUID();
        const newStatements: Statement[] = [
            ...convoData.statements,
            {
                id: newStatementId,
                text: newStatementText,
                author: "chatgpt",
                superAgrees: 0,
                agrees: 0,
                disagrees: 0,
                passes: 0,
            } as Statement
        ];
    }
}