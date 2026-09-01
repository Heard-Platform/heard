import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "./utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Checkbox } from "./checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

interface ComboboxProps {
  trigger: ReactNode;
  options: string[];
  selectedValues?: string[];
  closeOnSelect?: boolean;
  allowCreate?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  createLabel?: (value: string) => ReactNode;
  onSelect: (value: string) => void;
}

export function ComboBox({
  trigger,
  options,
  selectedValues,
  closeOnSelect = true,
  allowCreate = false,
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  contentClassName,
  createLabel = (value) => `Create "${value}"`,
  align = "start",
  onSelect,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const dialog = anchorRef.current?.closest('[data-slot="dialog-content"]');
    if (dialog) setDialogContainer(dialog as HTMLElement);
  }, []);

  const trimmedSearch = search.trim();
  const canCreate =
    allowCreate &&
    trimmedSearch.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmedSearch.toLowerCase());

  const handleSelect = (value: string) => {
    onSelect(value);
    if (closeOnSelect) {
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <span ref={anchorRef} style={{ display: "contents" }}>
      <Popover
        open={open}
        onOpenChange={(next: boolean) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className={cn("w-56 p-0", contentClassName)}
          align={align}
          container={dialogContainer}
        >
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => handleSelect(option)}>
                  {selectedValues && (
                    <Checkbox checked={selectedValues.includes(option)} className="mr-2" />
                  )}
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
            {canCreate && (
              <CommandGroup>
                <CommandItem value={trimmedSearch} onSelect={() => handleSelect(trimmedSearch)}>
                  {createLabel(trimmedSearch)}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        </PopoverContent>
      </Popover>
    </span>
  );
}
