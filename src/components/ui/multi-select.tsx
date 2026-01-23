import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  maxDisplay = 2,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(
          'w-full justify-between bg-muted/50 border-0 font-normal',
          !selected.length && 'text-muted-foreground'
        )}
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          <span>{placeholder}</span>
        ) : selected.length <= maxDisplay ? (
          <div className="flex gap-1 flex-wrap overflow-hidden">
            {selected.slice(0, maxDisplay).map(value => {
              const option = options.find(o => o.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-5 max-w-[80px] truncate"
                >
                  {option?.label || value}
                </Badge>
              );
            })}
          </div>
        ) : (
          <span className="text-sm">{selected.length} selected</span>
        )}
        <ChevronDown className={cn(
          'ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform',
          open && 'rotate-180'
        )} />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm bg-muted/50 rounded border-0 outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={selected.includes(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    selected.includes(option.value) && 'bg-accent/50'
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <div className={cn(
                    'h-4 w-4 border rounded flex items-center justify-center shrink-0',
                    selected.includes(option.value) && 'bg-primary border-primary'
                  )}>
                    {selected.includes(option.value) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="truncate" title={option.label}>{option.label}</span>
                </div>
              ))
            )}
          </div>

          {/* Clear all / Select info */}
          {selected.length > 0 && (
            <div className="border-t p-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground px-1">
                {selected.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onChange([]);
                  setSearch('');
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
