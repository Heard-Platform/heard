const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const LINKABLE_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const convertMarkdownLinksToHtml = (escapedText: string) =>
  escapedText.replace(MARKDOWN_LINK_PATTERN, (markdownLink, linkText: string, linkUrl: string) =>
    LINKABLE_URL_PATTERN.test(linkUrl) ? `<a href='${linkUrl}'>${linkText}</a>` : markdownLink
  );

const convertLineBreaksToHtml = (text: string) => text.replace(/\r?\n/g, "<br>");

export const convertNewsletterMarkdownToHtml = (markdown: string) =>
  convertLineBreaksToHtml(convertMarkdownLinksToHtml(escapeHtml(markdown.trim())));
