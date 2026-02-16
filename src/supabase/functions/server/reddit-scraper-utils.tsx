import { scrapeRssToXml as scrapeRssAsXml } from "./scraper.tsx";
import Parser from 'rss-parser';

export async function getRedditPostDataByCriteria(criteria: {
    subredditName: string,
    maxPostAgeMins: number,
}): Promise<Record<string, string>[]> {
    const parser = new Parser({
        customFields: {
            feed: ['subtitle'],
        }
    });
    const xml = await scrapeRssAsXml(`https://www.reddit.com/r/${criteria.subredditName}/new.rss`);
    const feed = await parser.parseString(xml);

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - criteria.maxPostAgeMins)

    const redditPostsData: Record<string, string>[] = [];
    feed.items.forEach(item => {
        const postTime = new Date(item.isoDate!);
        const subredditDescription = feed.subtitle!.trim();
        const title = item.title!.trim();
        const selfText = item.contentSnippet!.slice(0, item.contentSnippet?.indexOf('submitted by    ')).trim();
        if (criteria.maxPostAgeMins === -1 || postTime > cutoffTime) redditPostsData.push({
            subredditDescription,
            title,
            selfText,
        });
    });

    return redditPostsData;
}