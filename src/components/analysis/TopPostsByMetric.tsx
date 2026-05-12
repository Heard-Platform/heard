import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { StatementVotes } from "../../types";

interface TopPostsByMetricProps {
  posts: StatementVotes[];
  title: string;
  subtitle?: string;
  metric?: (post: StatementVotes) => number;
  metricLabel?: string;
  badgeClassName?: string;
  numberBadgeClassName?: string;
}

const DEFAULT_NUMBER_BADGE_CLASS = "heard-badge-circle absolute top-2 right-2";

export function TopPostsByMetric({
  posts,
  title,
  subtitle,
  metric,
  metricLabel,
  badgeClassName,
  numberBadgeClassName = DEFAULT_NUMBER_BADGE_CLASS,
}: TopPostsByMetricProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">
        {posts.slice(0, 3).map((post, index) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow relative">
            <div className={numberBadgeClassName}>{index + 1}</div>
            <p className="text-sm mb-3 pr-8">{post.text}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>{post.agreeVotes}</span>
              </div>
              <div className="flex items-center gap-1 text-red-700">
                <XCircle className="w-3 h-3" />
                <span>{post.disagreeVotes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MinusCircle className="w-3 h-3" />
                <span>{post.passVotes}</span>
              </div>
              {metric && (
                <Badge
                  variant="outline"
                  className={`ml-auto ${badgeClassName ?? ""}`}
                >
                  {Math.round(metric(post))}% {metricLabel}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
