import personas, { getRandomPersona } from "./personas.tsx";
import { AiPrompt } from "./types.tsx";

export function makeTransformPromptFromRedditPost(postData: {
    subredditDescription: string,
    title: string,
    selfText: string,
}
): AiPrompt {
    const personaPrompt = getRandomPersona();

    const systemPrompt = `${personaPrompt}`;

    const userPrompt = `Consider a Reddit post with the following title and content:
Subreddit description: "${postData.subredditDescription}"
Post title: "${postData.title}"
Post content: "${postData.selfText}"

Please write:
1. A question that serves as a conversation topic, which does not at all contain suggestions for answers. 
The question should not contain any leading information which suggests answers, rather it should leave open the possibility for many different answers provided by other people.
2. 3 response statements that serve as distinct, meaningful, pointed responses to the conversation topic. 
The response statements should be concise and to the point, and not include any statements which are "catch-all." 
Response statements should never be written in the second-person or third-person. 
The response statements should avoid phrases like "I believe," "In my opinion," "For me," "I prefer," etc. 
The response statements should only contain a single clause, avoid using semicolons, avoid using prepositional phrases, and avoid using verbs.
The response statements should each represent a distinct opinion regarding the debate question. 
At least one of the response statements should represent an unpopular opinion or approach to the topic. 
The response statements should not include explanations or reasoning.
It is okay if a statement consists of only one, two, or a few words. 
Response statements should not include periods at the end of sentences unless necessary for clarity.
Each response statement should have a 5% chance of containing a common misspelling.
The order of the response statements should be randomized.

In your response, please write the conversation topic question on the first line, and the response statements on subsequent lines.
Please do not offer ANY output other than the properly formatted conversation topic question and the response statements.
If the Reddit post title and post content would not translate into a good conversation topic, please output only the word "Error" and nothing else.`;
    
    return {
        systemPrompt,
        userPrompt,
    } as AiPrompt;
}