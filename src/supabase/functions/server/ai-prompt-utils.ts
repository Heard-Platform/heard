import { getRandomPersona } from "./personas.tsx";
import { AiPrompt } from "./types.tsx";

export function makeTransformPromptFromRedditPost(postData: {
    subredditDescription: string,
    title: string,
    selfText: string,
}
): AiPrompt {
    const personaPrompt = getRandomPersona();

    const systemPrompt = personaPrompt + ` You write concisely. Before attempting any conversion, you must first check 
whether the post is suitable. If the post meets any disqualifying condition, 
your entire response must be only the word \"Error\" — no topic, no responses, nothing else.`;

    console.debug('Reddit post title: ' + postData.title);
    console.debug('Reddit post self-text: ' + postData.selfText);

    const userPrompt = `Convert the following Reddit post into a open-ended discussion question 
and a set of response statements that represent distinct personal perspectives people might hold on that question. 

Reddit Post: 
Subreddit description: "${postData.subredditDescription}" 
Post title: "${postData.title}" 
Post content: "${postData.selfText}" 

BEFORE DOING ANYTHING ELSE — if any condition below is met, respond with only the word "Error" and stop immediately. Do not generate a topic or responses: 
- The Reddit post is a personal crisis, personal conflict, vent, expression of emotional distress, request for advice about 
an interpersonal or emotional situation, or a post describing a specific situation in the poster's life 
and asking for others' opinions on it (including posts that end with questions like "am I overreacting?", "is this normal?", 
or "what should I do?") 
- The Reddit post is too vague or broad to yield a focused discussion question 
- The Reddit post is a call to action, is urging others to think, feel, or behave in a particular way, 
or is telling others how they should respond to a situation (e.g. "please call your representative", "sign this petition", 
"we have to rise above", "share this post", "never consider fighting fire with fire") 
- The Reddit post is a news headline about a specific political figure, political event, or political organization 
- The Reddit post dismisses, minimizes, or misrepresents a recognized medical or psychological condition 
- The Reddit post is too specific or transactional to yield a universal discussion question (e.g. asking for product recommendations, 
service providers, event ticket purchasing, requests to join local activities or events, or other local information) 
- The Reddit post is a news report or account of a specific crime, accident, or violent incident 
- The Reddit post frames any number of marginalized or vulnerable groups in opposition to each other 
- The Reddit post is a review of, or primarily discusses or compares, a specific film, TV show, book, game, music track, song, album, 
or other media title — including posts that share or link to a specific piece of content 
- The Reddit post is a news headline or article about box office results, streaming numbers, entertainment industry statistics, or 
award show results
- The Reddit post contains quotes from, or is primarily about, named real people (celebrities, public figures, politicians, athletes, etc.) 
- The Reddit post makes or comments on allegations or claims about named real people 

Topic rules: 
- A single open-ended question anyone could answer, not just the poster 
- For debate-style posts, focus the topic on the personal experience or feeling behind the debate rather than the debate itself. 
For example, a CMV post about partisan morality should yield "What do you think shapes your own sense of right and wrong?" not 
"What do you think about the relationship between moral reasoning and democracy?" 
- The topic should preserve the subject matter of the Reddit post even if it generalizes the framing — 
do not discard the core subject when making it universal. For example, a post about a person who can see 100 million colors 
should yield a topic about experiencing the world differently, not a generic topic about "unique perceptions". 
A post about a city spending public money on an airport built to one airline's needs should yield a topic like 
"What do you think about cities making big financial bets on a single company?" 
not a generic topic about "public funding on infrastructure". A TIL post about piggy banks having ancient origins should yield 
"What's your relationship with saving money?" not "What do you think about the history of saving money?" 
A post debating whether steroid users deserve Hall of Fame recognition should yield 
"What do you think should matter most when deciding a player's Hall of Fame eligibility?" not 
"What do you think about the treatment of athletes in sports?"
- The topic must invite personal experience or preference, not analysis or commentary. Favor questions that start with "What do you..." or 
"How do you..." over "What impact does..." or "What role does..." or "What are the best..." or 
"What is the purpose of..." For example, a post about BART hiring more staff despite losing riders should yield 
"What do you think about how public transit is run in your area?" not "What do you think about public transit decisions during 
ridership declines?" 
- Must not be a yes/no question or any question that can be answered with a simple agree/disagree, true/false, or still/no longer 
- Must not begin with "Should", "Is", "Are", "Was", "Were", "Do", "Does", "Did", "Can", "Will", or "Would" 
- If the generated topic begins with any of the forbidden words, rewrite it as an open-ended question instead. 
For example, "Are expensive online birthday cards worth the cost?" should become "What makes a birthday card feel meaningful to you?" 

Response rules:
- Before writing each response, imagine a specific type of person (e.g. a skeptic, an enthusiast, someone who had a bad experience) and 
write what that person would say out loud to a friend — not what they would write in an essay. 
STRICT MAX 8 WORDS — cut mercilessly. (e.g. "I never realized how important flossing was" or "Too many people take it way too seriously" — 
not "Endorsements can elevate a figure's relevance")
- Never use "everyone", "some people", "most people", "we", or any other generalization — speak only for yourself
- Must directly answer the topic question 
- Never reference specific details, objects, or situations from the Reddit post — responses must make sense without any knowledge of the source material 
- Cover a range of viewpoints — at least one unpopular or minority opinion 
- The unpopular opinion must still be a plausible perspective that a real person might genuinely hold — not a flippant or absurd contrarian take 
- The order of responses should be randomized — do not always put the unpopular opinion last 
- Responses must be complete thoughts — never trail off with ellipses or incomplete sentences 
- No quotation marks, no trailing punctuation of any kind — no periods, exclamation marks, or question marks 

Format: topic on line 1, EXACTLY 2-3 responses on subsequent lines, no blank lines, nothing else.`;
    
    return {
        systemPrompt,
        userPrompt,
    };
}