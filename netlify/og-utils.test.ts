import { describe, expect, it } from "vitest";
import { buildRedirectOgPage, createRedirectOgHandler, isCrawler } from "./og-utils";

const meta = {
  title: "Heard Live",
  description: "Vote together live.",
  url: "https://heard.vote/live",
  image: "https://heard.vote/default-link-preview.png",
};
const destination = "https://luma.com/8oq6ealq";

const LINKEDIN_UA = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)";
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

function requestWithUserAgent(userAgent?: string): Request {
  const headers = userAgent ? { "user-agent": userAgent } : undefined;
  return new Request("https://heard.vote/live", { headers });
}

describe("isCrawler", () => {
  it("recognizes LinkedIn's crawler", () => {
    expect(isCrawler(LINKEDIN_UA)).toBe(true);
  });

  it("does not flag a regular browser", () => {
    expect(isCrawler(BROWSER_UA)).toBe(false);
  });
});

describe("buildRedirectOgPage", () => {
  const page = buildRedirectOgPage(meta, destination);

  it("includes the open graph tags", () => {
    expect(page).toContain(`<meta property="og:title" content="${meta.title}" />`);
    expect(page).toContain(`<meta property="og:image" content="${meta.image}" />`);
    expect(page).toContain(`<meta property="og:url" content="${meta.url}" />`);
  });

  it("links to the destination", () => {
    expect(page).toContain(`<a href="${destination}">`);
  });
});

describe("createRedirectOgHandler", () => {
  const handler = createRedirectOgHandler(meta, destination);

  it("redirects browsers to the destination", () => {
    const response = handler(requestWithUserAgent(BROWSER_UA));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(destination);
  });

  it("redirects requests without a user agent", () => {
    const response = handler(requestWithUserAgent());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(destination);
  });

  it("serves the preview page to crawlers", async () => {
    const response = handler(requestWithUserAgent(LINKEDIN_UA));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toBe(buildRedirectOgPage(meta, destination));
  });
});
