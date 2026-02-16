import { DebateRoom, Statement } from "./types.tsx";

export function generateAiPromptForHeardConvoFromRedditPostData(postData: {
    subredditDescription: string,
    title: string,
    selfText: string,
}
): Record<string, string> {
    const systemPrompt = `Transform raw Reddit post titles and post content into clean conversation topics and response statements that make sense. When writing the conversation topics and response statements, intelligently use writing patterns that indicate the text for each different statement could have been written by a different human. Try to preserve the tone and style of the original Reddit post title and post content.`;

    const userPrompt = `Consider a Reddit post with the following title and content:
Subreddit description: "${postData.subredditDescription}"
Post title: "${postData.title}"
Post content: "${postData.selfText}"

Please write:
1. A question that serves as a conversation topic, which does not at all contain any suggestions for answers.
2. 3 statements that serve as distinct, meaningful, pointed responses to the conversation topic. These should be concise and to the point, and not include any statements which are "catch-all," they should each represent a distinct opinion regarding the debate question. They should also avoid phrases like "I believe," "In my opinion," "For me," "I prefer," etc. The phrases should be confident, concise responses devoid of common turns of phrase. The different statements should also use varying patterns of speech that indicate they were written by different real people, and not a computer.

In your response, please write the conversation topic question on the first line, and the response statements on subsequent lines.
Please do not offer ANY output other than the properly formatted conversation topic question and the response statements.
If the Reddit post title and post content would not translate into a good conversation topic, please output only the word "Error" and nothing else.`;
    
    return {
        systemPrompt,
        userPrompt,
    };
}

export function generateAiPromptForNewStatementFromConvoData(convoData: {
    room: DebateRoom,
    statements: Statement[],
}): Record<string, string> {
    const systemPrompt = `You are a copy editor. Write statements in a tone consistent with the material you are provided with. Keep statements concise, to the point, and don't repeat information or opinions from the statements provided.`;

    const userPrompt = `Consider the conversation topic: ${convoData.room.topic}
And consider the current responses to this topic: ${convoData.statements.map(stmt => stmt.text).join(', ')}
In our use-case, users can vote to "agree," "disagree," or "pass" when they are presented with each of the response statements.
You are tasked with contributing a new statement to this discussion which:
1. Serves as an interesting response to the topic,
2. Differs meaningfully from existing response statements.
3. Has a high probability of garnering votes from users who may not have voted for any existing statements.

When responding, please present only a single statement with no line breaks.

If for any reason you cannot produce an additional statement for this conversation, please respond with only the word "Error" and nothing else.`;

    return {
        systemPrompt,
        userPrompt,
    };
}