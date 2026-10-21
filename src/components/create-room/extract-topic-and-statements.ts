import { api } from "../../utils/api";

export interface ExtractedTopicAndStatements {
  topic: string;
  statements: string[];
}

export async function extractTopicAndStatements(rant: string): Promise<ExtractedTopicAndStatements> {
  const response = await api.extractTopicAndStatements(rant);
  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to extract topic and statements");
  }
  return response.data;
}
