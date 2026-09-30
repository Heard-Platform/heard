export function topicMatchesSearch(topic: string, search: string): boolean {
  return topic.toLowerCase().includes(search.trim().toLowerCase());
}
