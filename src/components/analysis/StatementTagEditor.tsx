import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { ComboBox } from "../ui/combobox";

interface StatementTagEditorProps {
  statementId: string;
  tags: Array<{ id: string; name: string }>;
  isModerator: boolean;
  availableTagNames: string[];
  onAddTag: (statementId: string, name: string) => Promise<boolean>;
  onRemoveTag: (statementId: string, tagId: string) => Promise<boolean>;
}

export function StatementTagEditor({
  statementId,
  tags,
  isModerator,
  availableTagNames,
  onAddTag,
  onRemoveTag,
}: StatementTagEditorProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isModerator && tags.length === 0) return null;

  const appliedNames = new Set(tags.map((t) => t.name));
  const suggestions = availableTagNames.filter((name) => !appliedNames.has(name));

  const handleSelect = async (name: string) => {
    setSubmitting(true);
    await onAddTag(statementId, name);
    setSubmitting(false);
  };

  const handleRemove = async (tagId: string) => {
    setSubmitting(true);
    await onRemoveTag(statementId, tagId);
    setSubmitting(false);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1 ml-1.5 align-middle">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline" className="gap-1 font-normal">
          {tag.name}
          {isModerator && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleRemove(tag.id)}
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}

      {isModerator && (
        <ComboBox
          trigger={
            <button
              type="button"
              disabled={submitting}
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
              aria-label="Add tag"
              title="Add tag"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Tag className="w-3.5 h-3.5" />
              )}
            </button>
          }
          options={suggestions}
          onSelect={handleSelect}
          allowCreate
          searchPlaceholder="Tag name"
          emptyText="No tags found."
          contentClassName="w-56"
        />
      )}
    </span>
  );
}
