// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Code2, Copy, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../../utils/api";
import { DebateRoom } from "../../types";

interface DevAnonDebate extends DebateRoom {
  invitePath: string;
  anonymousLinkId: Required<DebateRoom>["anonymousLinkId"];
}

interface DevDebateListPanelProps {
  onJoinAnonymousLink: (anonymousLinkId: string) => void;
}

export function DevDebateListPanel({ onJoinAnonymousLink }: DevDebateListPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [debates, setDebates] = useState<DevAnonDebate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDebates = async () => {
    setLoading(true);
    try {
      const response = await api.getAnonDebates() as any
      if (response.success && response.data) {
        setDebates(response.data.debates || []);
      } else {
        toast.error("Failed to fetch debates");
      }
    } catch (error) {
      console.error("Error fetching debates:", error);
      toast.error("Error loading debates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      fetchDebates();
    }
  }, [menuOpen]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getFullUrl = (path: string) => {
    const origin = window.location.origin;
    return `${origin}${path}`;
  };

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-4 left-4 z-50 bg-blue-500/90 backdrop-blur-sm shadow-lg px-3 py-2 h-auto gap-2 text-white border-blue-300 hover:bg-blue-600 hover:text-white"
        >
          <Code2 className="w-4 h-4" />
          <span>Dev Panel</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Anonymous Debates (Dev)</SheetTitle>
          <SheetDescription>
            List of all anonymous-enabled test debates
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={fetchDebates}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
          {loading && debates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Loading debates...
            </div>
          )}

          {!loading && debates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No anonymous debates found. Create one from the lobby!
            </div>
          )}

          {debates.map((debate) => {
            const fullUrl = getFullUrl(debate.invitePath);
            return (
            <div
              key={debate.id}
              className={`p-4 rounded-lg border ${
                debate.isActive
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium line-clamp-2">{debate.topic}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      debate.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {debate.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>Created: {formatDate(debate.createdAt)}</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => copyToClipboard(fullUrl)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      onJoinAnonymousLink(debate.anonymousLinkId);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowRight className="w-3 h-3 mr-2" />
                    Open
                  </Button>
                </div>

                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                  {fullUrl}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}