import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { TopPost } from "../../types";

interface SpiciestPostsProps {
  spiciestPosts: TopPost[];
}

export function SpiciestPosts({ spiciestPosts }: SpiciestPostsProps) {
  if (spiciestPosts.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl">Spiciest Posts</h2>
        <p className="text-xs text-muted-foreground mt-1">Most controversial takes</p>
      </div>
      <div className="space-y-3">
        {spiciestPosts.slice(0, 3).map((post, index) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow relative">
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs">
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
              <Badge variant="outline" className="ml-auto bg-red-50 text-red-700 border-red-200">
                {Math.round(post.consensusScore)}% consensus
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
