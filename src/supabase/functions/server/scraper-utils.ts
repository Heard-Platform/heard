export async function scrapeRssToXml(
    url: string,
): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://google.com/',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xml = await response.text();
    return xml;
}