import { escapeHtml } from "./utils.tsx";

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const LINKABLE_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

const convertMarkdownLinksToHtml = (escapedText: string) =>
  escapedText.replace(
    MARKDOWN_LINK_PATTERN,
    (markdownLink, linkText: string, linkUrl: string) =>
      LINKABLE_URL_PATTERN.test(linkUrl)
        ? `<a href='${linkUrl}'>${linkText}</a>`
        : markdownLink,
  );

const convertLineBreaksToHtml = (text: string) =>
  text.replace(/\r?\n/g, "<br>");

export const convertNewsletterMarkdownToHtml = (markdown: string) =>
  convertLineBreaksToHtml(
    convertMarkdownLinksToHtml(escapeHtml(markdown.trim())),
  );
