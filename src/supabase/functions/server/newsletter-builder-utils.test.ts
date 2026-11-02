import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  Newsletter,
  NewsletterSection,
  FIRST_NEWSLETTER_BUILDER_EDITION,
  getNextNewsletterEditionNumber,
  isNewsletterBuilderEdition,
  saveNewsletter,
  toNewsletterParams,
} from "./newsletter-builder-utils.ts";
import { RouteError } from "./route-error.ts";

const BLANK_SECTION: NewsletterSection = { title: "", text: "", imageUrl: "", imageLink: "" };

const makeSection = (overrides: Partial<NewsletterSection> = {}): NewsletterSection => ({
  title: "🎉 Big news",
  text: "Check out [the post](https://heard.vote/room/abc).",
  imageUrl: "https://example.com/image.png",
  imageLink: "https://heard.vote",
  ...overrides,
});

const makeNewsletter = (overrides: Partial<Newsletter> = {}): Newsletter => ({
  editionNumber: 25,
  subject: "Heard Newsletter #25",
  sections: [makeSection(), makeSection(), makeSection()],
  updatedAt: 0,
  ...overrides,
});

describe("isNewsletterBuilderEdition", () => {
  it("is true from the first newsletter builder edition onward", () => {
    assertEquals(isNewsletterBuilderEdition(FIRST_NEWSLETTER_BUILDER_EDITION), true);
    assertEquals(isNewsletterBuilderEdition(FIRST_NEWSLETTER_BUILDER_EDITION + 3), true);
  });

  it("is false for the hand-coded editions and non-integers", () => {
    assertEquals(isNewsletterBuilderEdition(24), false);
    assertEquals(isNewsletterBuilderEdition(25.5), false);
  });
});

describe("getNextNewsletterEditionNumber", () => {
  it("starts at the first newsletter builder edition when none exist", () => {
    assertEquals(getNextNewsletterEditionNumber([]), FIRST_NEWSLETTER_BUILDER_EDITION);
  });

  it("is one past the highest newsletter builder edition", () => {
    const newsletters = [
      makeNewsletter({ editionNumber: 27 }),
      makeNewsletter({ editionNumber: 25 }),
    ];
    assertEquals(getNextNewsletterEditionNumber(newsletters), 28);
  });
});

describe("toNewsletterParams", () => {
  it("converts section text from markdown to html and uses the title as alt text", () => {
    const params = toNewsletterParams(makeNewsletter());
    assertEquals(params.subject, "Heard Newsletter #25");
    assertEquals(params.editionNumber, 25);
    assertEquals(params.section1, {
      title: "🎉 Big news",
      text: "Check out <a href='https://heard.vote/room/abc'>the post</a>.",
      imageUrl: "https://example.com/image.png",
      imageAlt: "🎉 Big news",
      imageLink: "https://heard.vote",
    });
  });

  it("escapes html in titles and image fields", () => {
    const section = makeSection({ title: `Tom & "Jerry"`, imageLink: "https://heard.vote/?a=1&b=2" });
    const params = toNewsletterParams(makeNewsletter({ sections: [section, makeSection(), makeSection()] }));
    assertEquals(params.section1.title, "Tom &amp; &quot;Jerry&quot;");
    assertEquals(params.section1.imageAlt, "Tom &amp; &quot;Jerry&quot;");
    assertEquals(params.section1.imageLink, "https://heard.vote/?a=1&amp;b=2");
  });

  it("leaves out a blank third section", () => {
    const params = toNewsletterParams(
      makeNewsletter({ sections: [makeSection(), makeSection(), { ...BLANK_SECTION, title: "  " }] }),
    );
    assertEquals(params.section3, undefined);
  });

  it("keeps a third section that has content", () => {
    const params = toNewsletterParams(makeNewsletter());
    assertEquals(params.section3?.title, "🎉 Big news");
  });
});

describe("saveNewsletter validation", () => {
  const validRequest = {
    editionNumber: 25,
    subject: "Heard Newsletter #25",
    sections: [makeSection(), makeSection(), makeSection()],
  };

  it("rejects hand-coded edition numbers", async () => {
    await assertRejects(() => saveNewsletter({ ...validRequest, editionNumber: 24 }), RouteError);
  });

  it("rejects a blank subject", async () => {
    await assertRejects(() => saveNewsletter({ ...validRequest, subject: "   " }), RouteError);
  });

  it("rejects anything but exactly three sections", async () => {
    await assertRejects(
      () => saveNewsletter({ ...validRequest, sections: [makeSection(), makeSection()] }),
      RouteError,
    );
  });

  it("rejects a section missing a field", async () => {
    await assertRejects(
      () => saveNewsletter({ ...validRequest, sections: [makeSection(), makeSection(), { title: "Only a title" }] }),
      RouteError,
    );
  });
});
