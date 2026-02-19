import { scrapeRssToXml as scrapeRssAsXml } from "./scraper-utils.ts";
import Parser from 'npm:rss-parser';
import { RedditFeedItem, RedditPost, RedditScrapeCriteria } from "./types.tsx";

export async function getRedditPosts(
  criteria: RedditScrapeCriteria,
): Promise<RedditPost[]> {
    const parser = new Parser({
        customFields: {
            feed: ['subtitle'],
        }
    });
    const xml = await scrapeRssAsXml(`https://www.reddit.com/r/${criteria.subredditName}/new.rss`);
    const feed = await parser.parseString(xml) as { items: RedditFeedItem[], subtitle: string };

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - criteria.maxPostAgeMins);

    const posts: RedditPost[] = [];
    feed.items.forEach((item: RedditFeedItem) => {
        const postTime = new Date(item.isoDate);
        const subredditDescription = feed.subtitle.trim();
        const title = item.title.trim();
        const selfText = item.contentSnippet
          .slice(0, item.contentSnippet.indexOf("submitted by    "))
          .trim();
        if (criteria.maxPostAgeMins === -1 || postTime > cutoffTime)
          posts.push({
            subredditDescription,
            title,
            selfText,
            pubDate: item.pubDate,
            subreddit: criteria.subredditName,
          });
    });

    posts.sort((a, b) => {
        const aTime = new Date(a.pubDate).getTime();
        const bTime = new Date(b.pubDate).getTime();
        return bTime - aTime;
    });

    posts.splice(criteria.postLimit);

    return posts;
}