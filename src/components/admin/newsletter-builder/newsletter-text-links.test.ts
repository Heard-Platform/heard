import { describe, expect, it } from "vitest";
import { isTextSelectionEmpty, wrapSelectedTextInMarkdownLink } from "./newsletter-text-links";

describe("wrapSelectedTextInMarkdownLink", () => {
  it("wraps the selected words in a markdown link and keeps the surrounding text", () => {
    const text = "Check out the post here.";
    const result = wrapSelectedTextInMarkdownLink(text, { start: 14, end: 23 }, "https://heard.vote/room/abc");
    expect(result).toBe("Check out the [post here](https://heard.vote/room/abc).");
  });

  it("wraps text at the very start and end", () => {
    expect(wrapSelectedTextInMarkdownLink("Heard", { start: 0, end: 5 }, "https://heard.vote")).toBe(
      "[Heard](https://heard.vote)",
    );
  });

  it("trims whitespace around the url", () => {
    expect(wrapSelectedTextInMarkdownLink("Heard", { start: 0, end: 5 }, "  https://heard.vote \n")).toBe(
      "[Heard](https://heard.vote)",
    );
  });

  it("encodes parentheses and spaces so the url cannot end the link early", () => {
    expect(
      wrapSelectedTextInMarkdownLink("Heard", { start: 0, end: 5 }, "https://heard.vote/a (b)"),
    ).toBe("[Heard](https://heard.vote/a%20%28b%29)");
  });

  it("leaves an existing link elsewhere in the text untouched", () => {
    const text = "[one](https://a.com) and two";
    expect(wrapSelectedTextInMarkdownLink(text, { start: 25, end: 28 }, "https://b.com")).toBe(
      "[one](https://a.com) and [two](https://b.com)",
    );
  });
});

describe("isTextSelectionEmpty", () => {
  it("is empty when start and end match", () => {
    expect(isTextSelectionEmpty({ start: 4, end: 4 })).toBe(true);
  });

  it("is not empty when text is selected", () => {
    expect(isTextSelectionEmpty({ start: 4, end: 9 })).toBe(false);
  });
});
