import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Statement, Comment } from "../types";

interface CommentingModalProps {
  isOpen: boolean;
  statement: Statement;
  roomTopic: string;
  comments: Comment[];
  currentUserId: string;
  onClose: () => void;
  onSubmitComment: (text: string) => void;
}

const ANON_AVATARS = [
  { emoji: "🐼", name: "Panda" },
  { emoji: "🦊", name: "Fox" },
  { emoji: "🐸", name: "Frog" },
  { emoji: "🐙", name: "Octopus" },
  { emoji: "🦋", name: "Butterfly" },
  { emoji: "🦁", name: "Lion" },
  { emoji: "🐢", name: "Turtle" },
  { emoji: "🦉", name: "Owl" },
];

const ANON_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-yellow-100 text-yellow-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-red-100 text-red-700",
  "bg-cyan-100 text-cyan-700",
  "bg-lime-100 text-lime-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
];

type AnonIdentity = {
  emoji: string;
  name: string;
  number?: number;
  color: string;
};

function generateAnonymousIdentities(comments: Comment[], statementId: string): Map<string, AnonIdentity> {
  const identitiesByUserId = new Map<string, AnonIdentity>();
  const uniqueUserIds = [...new Set(comments.map(c => c.userId))];
  const avatarCounts = new Map<number, number>();

  for (const userId of uniqueUserIds) {
    const combined = `${userId}-${statementId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    
    const avatarIndex = Math.abs(hash) % ANON_AVATARS.length;
    const colorIndex = Math.abs(hash >> 8) % ANON_COLORS.length;
    
    const avatar = ANON_AVATARS[avatarIndex];
    const sameAvatarCount = avatarCounts.get(avatarIndex) || 0;
    avatarCounts.set(avatarIndex, sameAvatarCount + 1);
    
    identitiesByUserId.set(userId, {
      emoji: avatar.emoji,
      name: avatar.name,
      number: sameAvatarCount > 1 ? sameAvatarCount : undefined,
      color: ANON_COLORS[colorIndex],
    });
  }

  return identitiesByUserId;
}

export function CommentingModal({
  isOpen,
  statement,
  roomTopic,
  comments,
  currentUserId,
  onClose,
  onSubmitComment,
}: CommentingModalProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitComment(commentText.trim());
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const identitiesByUserId = generateAnonymousIdentities(comments, statement.id);
  const currentUserIdentity = identitiesByUserId.get(currentUserId) || {
    emoji: "🐼",
    name: "Panda",
    color: "bg-purple-100 text-purple-700",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogTitle className="sr-only">Comments on statement</DialogTitle>
        <DialogDescription className="sr-only">
          View and add comments to this statement
        </DialogDescription>

        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium leading-relaxed">
                {statement.text}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {roomTopic}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          <AnimatePresence mode="popLayout">
            {comments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to share your thoughts!
                </p>
              </motion.div>
            ) : (
              comments.map((comment) => {
                const identity = identitiesByUserId.get(comment.userId) || {
                  emoji: "🐼",
                  name: "Panda",
                  color: "bg-purple-100 text-purple-700",
                };
                const isCurrentUser = comment.userId === currentUserId;
                
                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3"
                  >
                    <div className={`w-10 h-10 rounded-full ${identity.color} flex items-center justify-center flex-shrink-0 text-xl`}>
                      {identity.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {isCurrentUser 
                            ? "You" 
                            : `Anonymous ${identity.name}${identity.number ? ` #${identity.number}` : ""}`
                          }
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${currentUserIdentity.color} flex items-center justify-center text-lg flex-shrink-0`}>
              {currentUserIdentity.emoji}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Commenting as Anonymous {currentUserIdentity.name}{currentUserIdentity.number ? ` #${currentUserIdentity.number}` : ""}
            </span>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 min-h-[80px] resize-none"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              size="icon"
              className="h-[80px] w-12"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Cmd/Ctrl + Enter to send
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}