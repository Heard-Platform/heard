import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { convertNewsletterMarkdownToHtml, escapeHtml } from "./newsletter-markdown-utils.ts";

describe("convertNewsletterMarkdownToHtml", () => {
  it("turns a markdown link into an html link", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("Check out [the post](https://heard.vote/room/abc) today."),
      "Check out <a href='https://heard.vote/room/abc'>the post</a> today.",
    );
  });

  it("converts several links in one paragraph", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("[one](https://a.com) and [two](https://b.com)"),
      "<a href='https://a.com'>one</a> and <a href='https://b.com'>two</a>",
    );
  });

  it("escapes html typed into the text so it shows as written", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("Tom & Jerry say 5 < 6 <b>loudly</b>"),
      "Tom &amp; Jerry say 5 &lt; 6 &lt;b&gt;loudly&lt;/b&gt;",
    );
  });

  it("escapes the link text and keeps query string ampersands valid in the url", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("[Q&A](https://heard.vote/?a=1&b=2)"),
      "<a href='https://heard.vote/?a=1&amp;b=2'>Q&amp;A</a>",
    );
  });

  it("escapes single quotes in a url so they cannot end the href early", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("[it](https://heard.vote/it's)"),
      "<a href='https://heard.vote/it&#39;s'>it</a>",
    );
  });

  it("leaves links with non web urls as plain text", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("[click](javascript:alert(1))"),
      "[click](javascript:alert(1))",
    );
  });

  it("allows mailto links", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("[Email me](mailto:alex@heard.vote)"),
      "<a href='mailto:alex@heard.vote'>Email me</a>",
    );
  });

  it("turns line breaks into br tags and trims the ends", () => {
    assertEquals(
      convertNewsletterMarkdownToHtml("\nFirst line\nSecond line\r\n\r\nNew paragraph\n"),
      "First line<br>Second line<br><br>New paragraph",
    );
  });
});

describe("escapeHtml", () => {
  it("escapes every html special character", () => {
    assertEquals(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
