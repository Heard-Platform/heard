import { getRandomPersona } from "./personas.tsx";
import { AiPrompt } from "./types.tsx";

export function makeTransformPromptFromRedditPost(postData: {
    subredditDescription: string,
    title: string,
    selfText: string,
}
): AiPrompt {
    const personaPrompt = getRandomPersona();

    const systemPrompt = personaPrompt + " You write concisely.";

    const userPrompt = `Convert the following Reddit post into a conversation topic and a set of response statements.

Reddit Post:
Subreddit description: "${postData.subredditDescription}"
Post title: "${postData.title}"
Post content: "${postData.selfText}"

Instructions:
- The conversation topic should be a single, open-ended question that captures the core theme of the post. It should feel universal and inviting — something anyone could weigh in on, not just the original poster. Avoid framing that presupposes a particular behavior or belief. 
- The conversation topic must not be a yes/no question. 
- The conversation topic should not ask for lists, rankings, or "top X" answers. It should invite open-ended personal perspectives, not enumeration. 
- The conversation topic should not suggest or imply any specific answers within the question itself. Any question that names options, categories, or examples — in any form — is invalid. The question should be open enough that the model generating responses has to decide what the answers are, not pick from options the question already provided. 
- Generate 2-3 response statements. Each should be a concise, first-person statement representing a distinct perspective or answer to the question. 
- Response statements should be written from a personal point of view, as if a real person is sharing their own stance. Avoid abstract or observational phrases that describe an attitude from the outside (e.g. "Concern about safety" should instead be something like "My kid's safety comes first"). 
- Each response statement must directly answer the conversation topic question. Discard any statement that could exist independently of the question. 
- Response statements should be a short noun phrase or fragment — never a full sentence. Express the "what" without any reasoning, justification, or opinion attached. E.g. "A world overrun by AI" not "A world overrun by AI feels like a real possibility." 
- Response statements should not be in quotation marks. 
- Response statements should not include a period at the end of sentences. 
- Statements should cover a range of viewpoints. At least one should represent a minority or unpopular opinion that many people would disagree with. All statements must still directly answer the question — contrarian opinions about the question's premise are not valid responses. 
- Do not reference Reddit, the original post, or the original poster. 
- Do not include any statements that are overly specific to the original poster's situation. 

Please respond with nothing other than the conversation topic on the initial line and the response statements on subsequent lines. 
Do not include any blank lines in your response.`;
    
    return {
        systemPrompt,
        userPrompt,
    };
}