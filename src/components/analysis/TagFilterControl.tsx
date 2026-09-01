import { Tag, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ComboBox } from "../ui/combobox";

interface TagFilterControlProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterControl({ availableTags, selectedTags, onChange }: TagFilterControlProps) {
  if (availableTags.length === 0) return null;

  const toggleTag = (tag: string) => {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ComboBox
        trigger={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Filter by tag{selectedTags.length > 0 ? ` (${selectedTags.length})` : ""}
          </Button>
        }
        options={availableTags}
        selectedValues={selectedTags}
        onSelect={toggleTag}
        closeOnSelect={false}
        searchPlaceholder="Search tags..."
        emptyText="No tags found."
        contentClassName="w-64"
      />

      {selectedTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button type="button" onClick={() => toggleTag(tag)} aria-label={`Remove ${tag} filter`}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      {selectedTags.length > 0 && (
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      )}
    </div>
  );
}
