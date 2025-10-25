import { ReactNode } from "react";
import { Button } from "../components/ui/button";

interface StoryVariant<T extends string> {
  id: T;
  label: string;
}

interface StoryContainerProps<T extends string> {
  title: string;
  variants: StoryVariant<T>[];
  activeVariant: T;
  onVariantChange: (variant: T) => void;
  children: ReactNode;
  debugInfo?: ReactNode;
  previewClassName?: string;
}

export function StoryContainer<T extends string>({
  title,
  variants,
  activeVariant,
  onVariantChange,
  children,
  debugInfo,
  previewClassName = "bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border border-slate-200",
}: StoryContainerProps<T>) {
  return (
    <div className="space-y-4">
      {/* Title + Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-slate-200">
        <h2 className="text-slate-900">{title}</h2>
        <div className="flex items-center gap-2">
          {variants.map((variant) => (
            <Button
              key={variant.id}
              onClick={() => onVariantChange(variant.id)}
              variant={activeVariant === variant.id ? "default" : "outline"}
              size="sm"
            >
              {variant.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Component Preview */}
      <div className={previewClassName}>
        {children}
      </div>

      {/* Debug info (optional) */}
      {debugInfo && (
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs space-y-1">
          {debugInfo}
        </div>
      )}
    </div>
  );
}
