import { scrapeRssToXml as scrapeRssAsXml } from "./scraper-utils.ts";
import Parser from 'npm:rss-parser';

type FeedItem = {
    title: string;
    link: string;
    pubDate: string;
    contentSnippet: string;
    isoDate: string;
};

type RedditPost = {
    subredditDescription: string,
    title: string,
    selfText: string,
};

export async function getRedditPosts(criteria: {
    subredditName: string,
    maxPostAgeMins: number,
}): Promise<RedditPost[]> {
    const parser = new Parser({
        customFields: {
            feed: ['subtitle'],
        }
    });
    const xml = await scrapeRssAsXml(`https://www.reddit.com/r/${criteria.subredditName}/new.rss`);
    const feed = await parser.parseString(xml);

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - criteria.maxPostAgeMins)

    const posts: RedditPost[] = [];
    feed.items.forEach((item: FeedItem) => {
        const postTime = new Date(item.isoDate);
        const subredditDescription = feed.subtitle.trim();
        const title = item.title.trim();
        const selfText = item.contentSnippet.slice(0, item.contentSnippet.indexOf('submitted by    ')).trim();
        if (criteria.maxPostAgeMins === -1 || postTime > cutoffTime) posts.push({
            subredditDescription,
            title,
            selfText,
        });
    });

    return posts;
}