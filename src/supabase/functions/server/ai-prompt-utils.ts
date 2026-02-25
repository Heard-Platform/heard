import { getRandomPersona } from "./personas.tsx";
import { AiPrompt } from "./types.tsx";

export function makeTransformPromptFromRedditPost(postData: {
    subredditDescription: string,
    title: string,
    selfText: string,
}
): AiPrompt {
    const personaPrompt = getRandomPersona();

    const systemPrompt = personaPrompt;

    const userPrompt = `You are a user of a social media website called "Heard" where there exist "conversation topics," 
which pose a question, and "response statements," which represent subjective responses to the question. 
Users can vote to "agree," "disagree," or "pass" on each response statement.

For example, this would be a good Heard post: 
Topic: 
Should the city close the street that runs through the farmers' market while the market is open?
Responses: 
Yes, keeping the road open poses a safety risk for pedestrians 
No, closing the road would decrease traffic to the farmers' market 
No, closing the road would prevent residents of the street from reaching their homes 
Yes, there are alternate routes for drivers to use 

This would also be a good Heard post: 
Topic: 
What factors influence your trust in advice from strangers?
Responses:
Their confidence level
Personal background
I would never take advice from a stranger

Each user of Heard is able to vote "agree" or "disagree" to each of the response statements.

Consider a Reddit post with the following title and content:
Subreddit description: "${postData.subredditDescription}"
Post title: "${postData.title}"
Post content: "${postData.selfText}" 

Your task is to use this Reddit post as inspiration for a new Heard conversation topic, and come up with some appropriate response statements.

If the Reddit post title and post content would not translate into a good Heard conversation topic, 
please output only the word "Error" and nothing else. 

If the Reddit post title and post content would translate into a good Heard conversation topic, please write: 
1. A question that serves as the Heard conversation topic, which is a neutral question devoid of leading statements. 
The potential answers to this question should be subjective, not objective. The question should not ask for a list of answers. 
2. 3 Heard response statements that serve as distinct, meaningful, pointed responses to the Heard conversation topic. 
The Heard response statements should be concise and to the point, and not include any statements which are "catch-all." 
Heard response statements should never be written in the second-person or third-person. 
The Heard response statements should avoid phrases like "I believe," "In my opinion," "For me," "I prefer," etc. 
The Heard response statements should only contain a single clause, avoid using semicolons, avoid using prepositional phrases, and avoid using verbs. 
The Heard response statements should each represent a distinct opinion regarding the debate question. 
At least one of the Heard response statements should represent an unpopular opinion or approach to the topic. 
The Heard response statements should not include explanations or reasoning. 
It is okay if a Heard response statement consists of only one, two, or a few words. 
Heard response statements should not include periods at the end of sentences unless necessary for clarity. 
Each Heard response statement should have a 5% chance of containing a common misspelling. 
The order of the Heard response statements should be randomized. 

In your response, please write the Heard conversation topic question on the first line, and the Heard response statements on subsequent lines. 
Do not output any blank lines.
Please do not offer ANY output other than the properly formatted Heard conversation topic question and the Heard response statements.`;
    
    return {
        systemPrompt,
        userPrompt,
    };
}