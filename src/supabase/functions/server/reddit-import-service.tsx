import { generateAiPromptForHeardConvoFromRedditPostData } from './ai-prompt-utils.tsx';
import { getRedditPostDataByCriteria } from "./reddit-scraper-utils.tsx";
import { EnrichmentService } from "./enrichment-service.tsx";


export class RedditImportService extends EnrichmentService {
    async createHeardConvoFromRedditPostData(postData: {
        subredditDescription: string,
        title: string,
        selfText: string,
    }): Promise<boolean> {
        const aiPrompts = generateAiPromptForHeardConvoFromRedditPostData(postData);

        const aiResponse = await this.aiClient.complete({ systemPrompt: aiPrompts.systemPrompt, userPrompt: aiPrompts.userPrompt });

        // AI was not able to create a topic and responses
        if (aiResponse.trim() === "Error") {
            console.log(`Error creating Heard convo from Reddit post:
Post title: ${postData.title}
Post self-text: ${postData.selfText}
---------------------------------------------`);
            return false;
        }

        const lines = aiResponse.split('\n');
        const trimmedLines = lines.map((str: string) => str.trim());
        const conversationTopic = trimmedLines[0]
        const conversationStatements = trimmedLines.slice(1);

        let msg = 'Heard convo successfully created from Reddit post:';
        msg += `\nReddit post title: ${postData.title}`;
        msg += `\nReddit post self-text: ${postData.selfText}`;
        msg += `\nHeard conversation topic: ${conversationTopic}`;
        conversationStatements.forEach((stmt, index) => {
            msg += `\nHeard response statement ${index + 1}: ${stmt}`;
        });
        msg += `\n---------------------------------------------`;
        console.log(msg);

        // TODO: Create Heard Conversation in database with the topic and statements we now have

        return true;
    }

    async createHeardConvosFromRedditCriteria(criteria: {
        subredditName: string,
        maxPostAgeMins: number,
    }): Promise<boolean> {
        const redditPostsData = await getRedditPostDataByCriteria(criteria);

        let result: boolean = true;
        for (const postData of redditPostsData) {
            // console.log(post);
            const r = await this.createHeardConvoFromRedditPostData(postData as { subredditDescription: string; title: string; selfText: string });
            if (!r) result = false;
        }
        return result;
    }
}