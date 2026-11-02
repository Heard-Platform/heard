export interface TextSelectionRange {
  start: number;
  end: number;
}

export const isTextSelectionEmpty = (selectionRange: TextSelectionRange) =>
  selectionRange.start === selectionRange.end;

const encodeUrlForMarkdownLink = (url: string) =>
  url.trim().replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20");

export const wrapSelectedTextInMarkdownLink = (
  text: string,
  selectionRange: TextSelectionRange,
  url: string,
) => {
  const textBeforeSelection = text.slice(0, selectionRange.start);
  const selectedText = text.slice(selectionRange.start, selectionRange.end);
  const textAfterSelection = text.slice(selectionRange.end);
  const linkUrl = encodeUrlForMarkdownLink(url);
  return `${textBeforeSelection}[${selectedText}](${linkUrl})${textAfterSelection}`;
};
