import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { TopPost } from "../../types";

interface TopAgreedPostsProps {
  topPosts: TopPost[];
}

export function TopAgreedPosts({ topPosts }: TopAgreedPostsProps) {
  if (topPosts.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl">Top Agreed Upon Posts</h2>
        <p className="text-xs text-muted-foreground mt-1">Super agrees are counted as agrees</p>
      </div>
      <div className="space-y-3">
        {topPosts.slice(0, 3).map((post, index) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow relative">
            <div className="heard-badge-circle absolute top-2 right-2">
              {index + 1}
            </div>
            <p className="text-sm mb-3 pr-8">{post.text}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>{post.agreeVotes}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>{post.disagreeVotes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MinusCircle className="w-3 h-3" />
                <span>{post.passVotes}</span>
              </div>
              <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                {Math.round(post.consensusScore)}% consensus
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}