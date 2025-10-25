import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { Textarea } from "./ui/textarea";

interface DescriptionDisplayProps {
  description?: string;
  isHost: boolean;
  onUpdate?: (description: string) => void;
}

export function DescriptionDisplay({ 
  description, 
  isHost, 
  onUpdate 
}: DescriptionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description || "");

  if (!description && !isHost) {
    return null; // Don't show anything if no description and user isn't host
  }

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(description || "");
    setIsEditing(false);
  };

  // Simple markdown parsing for basic formatting
  const parseMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  if (isEditing) {
    return (
      <Card className="p-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Edit Room Description</h4>
          </div>
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Provide context, background, or rules for this debate... (supports Markdown)"
            maxLength={2000}
            className="min-h-[100px] resize-none"
            rows={4}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {editValue.length}/2000 • Basic Markdown supported: **bold**, *italic*, `code`
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Room Context</h4>
          <div className="flex items-center gap-2">
            {isHost && description && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 px-2"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            )}
            {description && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {description ? (
          <div className="text-sm text-muted-foreground">
            <div
              className={`${!isExpanded ? 'line-clamp-3' : ''} leading-relaxed`}
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(description)
              }}
            />
          </div>
        ) : isHost ? (
          <div className="text-sm text-muted-foreground">
            <p>No description set. </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="mt-2"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Add Description
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}