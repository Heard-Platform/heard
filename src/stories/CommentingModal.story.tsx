import { useState } from "react";
import { CommentingModal } from "../components/CommentingModal";
import { Button } from "../components/ui/button";
import type { Statement, Comment } from "../types";

const mockStatement: Statement = {
  id: "stmt-1",
  text: "We should switch to a four-day work week to improve work-life balance and productivity.",
  author: "user-123",
  agrees: 42,
  disagrees: 18,
  passes: 5,
  superAgrees: 12,
  roomId: "room-1",
  timestamp: Date.now() - 3600000,
  round: 1,
  voters: {},
};

const mockComments: Comment[] = [
  {
    id: "comment-1",
    statementId: "stmt-1",
    userId: "user-456",
    text: "This would be amazing for mental health! I've seen studies that show productivity actually increases with shorter work weeks.",
    timestamp: Date.now() - 1800000,
  },
  {
    id: "comment-2",
    statementId: "stmt-1",
    userId: "user-789",
    text: "What about industries that require 24/7 coverage? How would this work for healthcare, emergency services, etc.?",
    timestamp: Date.now() - 1200000,
  },
  {
    id: "comment-3",
    statementId: "stmt-1",
    userId: "user-456",
    text: "Good point! Maybe it could be implemented sector by sector, starting with office jobs where it's easier to transition.",
    timestamp: Date.now() - 600000,
  },
  {
    id: "comment-4",
    statementId: "stmt-1",
    userId: "current-user",
    text: "I wonder if companies would reduce pay proportionally or keep it the same?",
    timestamp: Date.now() - 300000,
  },
];

export function CommentingModalStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const handleSubmitComment = (text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      statementId: mockStatement.id,
      userId: "current-user",
      text,
      timestamp: Date.now(),
    };
    setComments([...comments, newComment]);
  };

  const addManyComments = () => {
    const newComments: Comment[] = [];
    const sampleTexts = [
      "I completely agree with this perspective!",
      "This is an interesting point to consider.",
      "Have you thought about the long-term implications?",
      "Great discussion happening here!",
      "I see both sides of this argument.",
      "This reminds me of a similar situation I experienced.",
      "Could we explore this from another angle?",
      "The data supports this conclusion.",
      "I'm not sure I follow this logic.",
      "This is a nuanced issue that deserves careful thought.",
    ];

    for (let i = 0; i < 20; i++) {
      newComments.push({
        id: `bulk-comment-${Date.now()}-${i}`,
        statementId: mockStatement.id,
        userId: `bulk-user-${i}`,
        text: sampleTexts[i % sampleTexts.length],
        timestamp: Date.now() - (i * 10000),
      });
    }

    setComments([...comments, ...newComments]);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)} size="lg">
            Open Commenting Modal
          </Button>
          <Button onClick={addManyComments} variant="outline" size="lg">
            Add 20 Comments (Test Duplicates)
          </Button>
        </div>

        <CommentingModal
          isOpen={isOpen}
          statement={mockStatement}
          roomTopic="💼 What are your thoughts on the future of work?"
          comments={comments}
          currentUserId="current-user"
          onClose={() => setIsOpen(false)}
          onSubmitComment={handleSubmitComment}
        />
      </div>
    </div>
  );
}