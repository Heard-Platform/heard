import { useState, useEffect } from "react";
import { api, safelyMakeApiCall } from "../../utils/api";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { DebateRoom } from "../../types";

export function PostsTab() {
  const [posts, setPosts] = useState<DebateRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    const response = await safelyMakeApiCall(() => api.getAllPosts());
    if (response?.success && response.data) {
      setPosts(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">All Posts ({posts.length})</h2>
        <Button onClick={loadPosts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-slate-600 text-center py-12">
          No posts found
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">{post.hostId}</span>
                    <span>•</span>
                    <span>r/{post.subHeard}</span>
                    <span>•</span>
                  </div>
                  
                  <p className="text-slate-900 line-clamp-3">{post.topic}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Created: {formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
